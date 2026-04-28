const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'esim');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const LOGO_DIR = path.join(__dirname, '..', 'uploads', 'esim_logos');
if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `esim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Formato inválido (apenas PNG/JPG/WEBP)'));
  },
});

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, LOGO_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `logo_${req.params.id}_${Date.now()}${ext}`);
  },
});
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Formato inválido (PNG/JPG/WEBP/SVG)'));
  },
});

// ============ PUBLIC (user) ============

// Helper para listar produtos disponíveis (estoque > 0)
async function listAvailableProdutos() {
  const [rows] = await db.query(
    `SELECT p.id, p.name, p.operadora, p.amount, p.observacao, p.logo_image,
            (SELECT COUNT(*) FROM esim_estoque e WHERE e.produto_id = p.id) AS stock
     FROM esim_produtos p
     WHERE p.enabled = TRUE
     HAVING stock > 0
     ORDER BY p.operadora, p.amount`
  );
  return rows;
}

// Vitrine pública (sem auth) — usada na home pública
router.get('/publicos', async (req, res) => {
  try {
    const produtos = await listAvailableProdutos();
    res.json({ produtos });
  } catch (err) {
    console.error('eSIM list públicos:', err);
    res.status(500).json({ message: 'Erro ao listar produtos' });
  }
});

// Lista produtos com estoque > 0 (autenticada — usada dentro do sistema)
router.get('/produtos', authMiddleware, async (req, res) => {
  try {
    const produtos = await listAvailableProdutos();
    res.json({ produtos });
  } catch (err) {
    console.error('eSIM list produtos:', err);
    res.status(500).json({ message: 'Erro ao listar produtos' });
  }
});

// Comprar eSIM (debita saldo, entrega QR, deleta unidade)
router.post('/comprar/:produtoId', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const produtoId = req.params.produtoId;

    const [prods] = await conn.query('SELECT * FROM esim_produtos WHERE id = ? AND enabled = TRUE FOR UPDATE', [produtoId]);
    if (prods.length === 0) { await conn.rollback(); return res.status(404).json({ message: 'Produto não encontrado' }); }
    const produto = prods[0];

    const [users] = await conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [req.userId]);
    const user = users[0];
    if (parseFloat(user.balance) < parseFloat(produto.amount)) {
      await conn.rollback();
      return res.status(402).json({ message: 'Saldo insuficiente', insufficient: true });
    }

    const [stock] = await conn.query('SELECT * FROM esim_estoque WHERE produto_id = ? ORDER BY id ASC LIMIT 1 FOR UPDATE', [produtoId]);
    if (stock.length === 0) { await conn.rollback(); return res.status(409).json({ message: 'Sem estoque' }); }
    const unit = stock[0];

    await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [produto.amount, req.userId]);
    await conn.query('DELETE FROM esim_estoque WHERE id = ?', [unit.id]);
    const [ins] = await conn.query(
      'INSERT INTO esim_vendas (user_id, produto_id, produto_name, operadora, amount, observacao) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, produto.id, produto.name, produto.operadora, produto.amount, produto.observacao]
    );
    await conn.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.userId, 'esim_purchase', `eSIM ${produto.name} R$ ${produto.amount}`]);

    await conn.commit();

    // Lê imagem e devolve em base64 (uso único, depois deleta)
    const imgPath = path.join(UPLOAD_DIR, unit.qr_image);
    let qrBase64 = null;
    try {
      const buf = fs.readFileSync(imgPath);
      const mime = unit.qr_image.endsWith('.png') ? 'image/png'
                 : unit.qr_image.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      qrBase64 = `data:${mime};base64,${buf.toString('base64')}`;
      fs.unlinkSync(imgPath);
    } catch (e) {
      console.warn('[eSIM] falha lendo/deletando imagem:', e.message);
    }

    res.json({
      venda: {
        id: ins.insertId,
        produto_name: produto.name,
        operadora: produto.operadora,
        amount: produto.amount,
        observacao: produto.observacao,
      },
      qr: qrBase64,
    });
  } catch (err) {
    await conn.rollback();
    console.error('eSIM compra:', err);
    res.status(500).json({ message: 'Erro ao comprar eSIM' });
  } finally {
    conn.release();
  }
});

// Histórico do usuário
router.get('/minhas', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM esim_vendas WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ vendas: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erro' });
  }
});

// ============ ADMIN ============

router.get('/admin/produtos', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, (SELECT COUNT(*) FROM esim_estoque e WHERE e.produto_id = p.id) AS stock
       FROM esim_produtos p ORDER BY p.created_at DESC`
    );
    res.json({ produtos: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erro' });
  }
});

router.post('/admin/produtos', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, operadora, amount, observacao, enabled } = req.body;
    if (!name || !operadora || !amount) return res.status(400).json({ message: 'Campos obrigatórios' });
    const [r] = await db.query(
      'INSERT INTO esim_produtos (name, operadora, amount, observacao, enabled) VALUES (?, ?, ?, ?, ?)',
      [name, operadora, amount, observacao || '', enabled !== false]
    );
    res.json({ id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar' });
  }
});

router.put('/admin/produtos/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, operadora, amount, observacao, enabled } = req.body;
    await db.query(
      'UPDATE esim_produtos SET name=?, operadora=?, amount=?, observacao=?, enabled=? WHERE id=?',
      [name, operadora, amount, observacao || '', enabled !== false, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro' });
  }
});

router.delete('/admin/produtos/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Apaga imagens do estoque antes
    const [stock] = await db.query('SELECT qr_image FROM esim_estoque WHERE produto_id = ?', [req.params.id]);
    for (const s of stock) {
      try { fs.unlinkSync(path.join(UPLOAD_DIR, s.qr_image)); } catch {}
    }
    // Apaga logo se existir
    const [prod] = await db.query('SELECT logo_image FROM esim_produtos WHERE id = ?', [req.params.id]);
    if (prod[0]?.logo_image) {
      try { fs.unlinkSync(path.join(LOGO_DIR, prod[0].logo_image)); } catch {}
    }
    await db.query('DELETE FROM esim_produtos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Lista estoque de um produto
router.get('/admin/produtos/:id/estoque', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, qr_image, created_at FROM esim_estoque WHERE produto_id = ? ORDER BY id ASC', [req.params.id]);
    res.json({ estoque: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Adiciona unidades (upload de N imagens)
router.post('/admin/produtos/:id/estoque', authMiddleware, adminMiddleware, upload.array('files', 200), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ message: 'Nenhum arquivo' });
    const values = files.map((f) => [req.params.id, f.filename]);
    await db.query('INSERT INTO esim_estoque (produto_id, qr_image) VALUES ?', [values]);
    res.json({ added: files.length });
  } catch (err) {
    console.error('upload estoque:', err);
    res.status(500).json({ message: err.message || 'Erro no upload' });
  }
});

// Remove uma unidade do estoque
router.delete('/admin/estoque/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT qr_image FROM esim_estoque WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Não encontrado' });
    try { fs.unlinkSync(path.join(UPLOAD_DIR, rows[0].qr_image)); } catch {}
    await db.query('DELETE FROM esim_estoque WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Preview de imagem do estoque (para admin conferir)
router.get('/admin/estoque/:id/image', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT qr_image FROM esim_estoque WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).end();
    res.sendFile(path.join(UPLOAD_DIR, rows[0].qr_image));
  } catch {
    res.status(500).end();
  }
});

// ============ LOGO do produto ============

// Servir a logo publicamente (sem auth) — usada na vitrine/cards
router.get('/produtos/:id/logo', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT logo_image FROM esim_produtos WHERE id = ?', [req.params.id]);
    if (rows.length === 0 || !rows[0].logo_image) return res.status(404).end();
    const filePath = path.join(LOGO_DIR, rows[0].logo_image);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(filePath);
  } catch {
    res.status(500).end();
  }
});

// Upload da logo (admin)
router.post('/admin/produtos/:id/logo', authMiddleware, adminMiddleware, logoUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo' });
    const [rows] = await db.query('SELECT logo_image FROM esim_produtos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    // remove logo antiga se existir
    if (rows[0].logo_image) {
      try { fs.unlinkSync(path.join(LOGO_DIR, rows[0].logo_image)); } catch {}
    }
    await db.query('UPDATE esim_produtos SET logo_image = ? WHERE id = ?', [req.file.filename, req.params.id]);
    res.json({ ok: true, logo_image: req.file.filename });
  } catch (err) {
    console.error('upload logo eSIM:', err);
    res.status(500).json({ message: err.message || 'Erro no upload' });
  }
});

// Remover a logo (admin)
router.delete('/admin/produtos/:id/logo', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT logo_image FROM esim_produtos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Não encontrado' });
    if (rows[0].logo_image) {
      try { fs.unlinkSync(path.join(LOGO_DIR, rows[0].logo_image)); } catch {}
    }
    await db.query('UPDATE esim_produtos SET logo_image = NULL WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro' });
  }
});

module.exports = router;
