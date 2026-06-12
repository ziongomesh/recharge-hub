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

function normDdd(v) {
  if (v == null) return null;
  const s = String(v).replace(/\D/g, '');
  if (!s) return null;
  return s.slice(0, 2).padStart(2, '0');
}

async function listAvailableProdutos() {
  const [rows] = await db.query(
    `SELECT p.id, p.name, p.operadora, p.amount, p.observacao, p.logo_image,
            s.stock,
            (SELECT GROUP_CONCAT(DISTINCT IFNULL(ddd,'') ORDER BY ddd SEPARATOR ',')
               FROM esim_estoque WHERE produto_id = p.id) AS ddds_raw
     FROM esim_produtos p
     INNER JOIN (
       SELECT produto_id, COUNT(*) AS stock
       FROM esim_estoque
       GROUP BY produto_id
     ) s ON s.produto_id = p.id
     WHERE p.enabled = TRUE AND s.stock > 0
     ORDER BY p.operadora, p.amount`
  );
  return rows.map((r) => {
    const list = (r.ddds_raw || '').split(',').map((x) => x.trim()).filter(Boolean);
    delete r.ddds_raw;
    return { ...r, ddds: list };
  });
}

router.get('/publicos', async (req, res) => {
  try { res.json({ produtos: await listAvailableProdutos() }); }
  catch (err) { console.error('eSIM publicos:', err); res.status(500).json({ message: 'Erro' }); }
});

router.get('/produtos', authMiddleware, async (req, res) => {
  try { res.json({ produtos: await listAvailableProdutos() }); }
  catch (err) { console.error('eSIM produtos:', err); res.status(500).json({ message: 'Erro' }); }
});

// DDDs disponíveis de um produto (com contagem)
router.get('/produtos/:id/ddds', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT IFNULL(ddd,'') AS ddd, COUNT(*) AS stock
       FROM esim_estoque WHERE produto_id = ?
       GROUP BY ddd ORDER BY ddd`,
      [req.params.id]
    );
    res.json({ ddds: rows });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
});

// Comprar — aceita ?ddd=XX (opcional)
router.post('/comprar/:produtoId', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const produtoId = req.params.produtoId;
    const wantedDdd = normDdd(req.query.ddd || req.body?.ddd);

    const [prods] = await conn.query('SELECT * FROM esim_produtos WHERE id = ? AND enabled = TRUE FOR UPDATE', [produtoId]);
    if (prods.length === 0) { await conn.rollback(); return res.status(404).json({ message: 'Produto não encontrado' }); }
    const produto = prods[0];

    const [users] = await conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [req.userId]);
    const user = users[0];
    if (parseFloat(user.balance) < parseFloat(produto.amount)) {
      await conn.rollback();
      return res.status(402).json({ message: 'Saldo insuficiente', insufficient: true });
    }

    let stock;
    if (wantedDdd) {
      [stock] = await conn.query(
        'SELECT * FROM esim_estoque WHERE produto_id = ? AND ddd = ? ORDER BY id ASC LIMIT 1 FOR UPDATE',
        [produtoId, wantedDdd]
      );
      if (stock.length === 0) {
        await conn.rollback();
        return res.status(409).json({ message: `Sem estoque para o DDD ${wantedDdd}` });
      }
    } else {
      [stock] = await conn.query(
        'SELECT * FROM esim_estoque WHERE produto_id = ? ORDER BY id ASC LIMIT 1 FOR UPDATE',
        [produtoId]
      );
      if (stock.length === 0) { await conn.rollback(); return res.status(409).json({ message: 'Sem estoque' }); }
    }
    const unit = stock[0];

    await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [produto.amount, req.userId]);
    await conn.query('DELETE FROM esim_estoque WHERE id = ?', [unit.id]);
    const [ins] = await conn.query(
      'INSERT INTO esim_vendas (user_id, produto_id, produto_name, operadora, amount, observacao, ddd) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, produto.id, produto.name, produto.operadora, produto.amount, produto.observacao, unit.ddd || null]
    );
    await conn.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.userId, 'esim_purchase', `eSIM ${produto.name} R$ ${produto.amount}${unit.ddd ? ` DDD ${unit.ddd}` : ''}`]);

    await conn.commit();

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
        ddd: unit.ddd || null,
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

router.get('/minhas', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM esim_vendas WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json({ vendas: rows });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
});

// ============ ADMIN ============

router.get('/admin/produtos', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, (SELECT COUNT(*) FROM esim_estoque e WHERE e.produto_id = p.id) AS stock
       FROM esim_produtos p ORDER BY p.created_at DESC`
    );
    res.json({ produtos: rows });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao criar' }); }
});

router.put('/admin/produtos/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, operadora, amount, observacao, enabled } = req.body;
    await db.query(
      'UPDATE esim_produtos SET name=?, operadora=?, amount=?, observacao=?, enabled=? WHERE id=?',
      [name, operadora, amount, observacao || '', enabled !== false, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
});

router.delete('/admin/produtos/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [stock] = await db.query('SELECT qr_image FROM esim_estoque WHERE produto_id = ?', [req.params.id]);
    for (const s of stock) { try { fs.unlinkSync(path.join(UPLOAD_DIR, s.qr_image)); } catch {} }
    const [prod] = await db.query('SELECT logo_image FROM esim_produtos WHERE id = ?', [req.params.id]);
    if (prod[0]?.logo_image) { try { fs.unlinkSync(path.join(LOGO_DIR, prod[0].logo_image)); } catch {} }
    await db.query('DELETE FROM esim_produtos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
});

router.get('/admin/produtos/:id/estoque', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, qr_image, ddd, created_at FROM esim_estoque WHERE produto_id = ? ORDER BY ddd, id ASC', [req.params.id]);
    res.json({ estoque: rows });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
});

// Upload — aceita campo `ddd` no FormData (mesmo DDD para o lote)
router.post('/admin/produtos/:id/estoque', authMiddleware, adminMiddleware, upload.array('files', 200), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ message: 'Nenhum arquivo' });
    const ddd = normDdd(req.body?.ddd);
    const values = files.map((f) => [req.params.id, f.filename, ddd]);
    await db.query('INSERT INTO esim_estoque (produto_id, qr_image, ddd) VALUES ?', [values]);
    res.json({ added: files.length });
  } catch (err) {
    console.error('upload estoque:', err);
    res.status(500).json({ message: err.message || 'Erro no upload' });
  }
});

// Editar DDD de uma unidade
router.put('/admin/estoque/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ddd = normDdd(req.body?.ddd);
    await db.query('UPDATE esim_estoque SET ddd = ? WHERE id = ?', [ddd, req.params.id]);
    res.json({ ok: true, ddd });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
});

router.delete('/admin/estoque/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT qr_image FROM esim_estoque WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Não encontrado' });
    try { fs.unlinkSync(path.join(UPLOAD_DIR, rows[0].qr_image)); } catch {}
    await db.query('DELETE FROM esim_estoque WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
});

router.get('/admin/estoque/:id/image', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT qr_image FROM esim_estoque WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).end();
    res.sendFile(path.join(UPLOAD_DIR, rows[0].qr_image));
  } catch { res.status(500).end(); }
});

// ============ LOGO ============

router.get('/produtos/:id/logo', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT logo_image FROM esim_produtos WHERE id = ?', [req.params.id]);
    if (rows.length === 0 || !rows[0].logo_image) return res.status(404).end();
    const filePath = path.join(LOGO_DIR, rows[0].logo_image);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(filePath);
  } catch { res.status(500).end(); }
});

router.post('/admin/produtos/:id/logo', authMiddleware, adminMiddleware, logoUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo' });
    const [rows] = await db.query('SELECT logo_image FROM esim_produtos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    if (rows[0].logo_image) { try { fs.unlinkSync(path.join(LOGO_DIR, rows[0].logo_image)); } catch {} }
    await db.query('UPDATE esim_produtos SET logo_image = ? WHERE id = ?', [req.file.filename, req.params.id]);
    res.json({ ok: true, logo_image: req.file.filename });
  } catch (err) {
    console.error('upload logo eSIM:', err);
    res.status(500).json({ message: err.message || 'Erro no upload' });
  }
});

router.delete('/admin/produtos/:id/logo', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT logo_image FROM esim_produtos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Não encontrado' });
    if (rows[0].logo_image) { try { fs.unlinkSync(path.join(LOGO_DIR, rows[0].logo_image)); } catch {} }
    await db.query('UPDATE esim_produtos SET logo_image = NULL WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: 'Erro' }); }
});

module.exports = router;
