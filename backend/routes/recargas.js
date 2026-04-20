const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

const POEKI_URL = 'https://portal.poeki.dev/api/v2';

function poekiHeaders() {
  return { 'X-API-Key': process.env.POEKI_API_KEY, 'Content-Type': 'application/json' };
}

// Normaliza status vindos da Poeki/legados para o vocabulário do frontend.
// "enviado_provedor", "processing", "enviada", etc. viram "andamento".
function normalizeStatus(s) {
  if (!s) return s;
  const v = String(s).toLowerCase().trim();
  const inProgress = new Set([
    'enviado_provedor', 'enviado-provedor', 'enviado',
    'processing', 'processando', 'em_andamento', 'em-andamento',
    'enviada', 'enviada_provedor', 'in_progress',
  ]);
  if (inProgress.has(v)) return 'andamento';
  return v;
}

function normalizeRecargaRow(r) {
  if (r && r.status) r.status = normalizeStatus(r.status);
  return r;
}

router.post('/detect', authMiddleware, async (req, res) => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    const raw = String(req.body.phone || '').replace(/\D/g, '');
    const localPhone = raw.startsWith('55') && raw.length > 11 ? raw.slice(2) : raw;
    const candidates = [...new Set([
      localPhone,
      localPhone.startsWith('55') ? localPhone : `55${localPhone}`,
    ].filter((phone) => phone.length >= 10))];

    let lastData = null;
    let lastError = null;

    for (let i = 0; i < candidates.length; i++) {
      const phone = candidates[i];
      logger.recarga.detect(phone, req.userId);
      console.log(`[POEKI detect] tentativa ${i + 1}/${candidates.length} telefone=${phone}`);

      try {
        const { data } = await axios.post(`${POEKI_URL}/detect-operator`, { phone }, {
          headers: poekiHeaders(),
          timeout: 8000,
        });

        lastData = data;
        const payload = data?.data || data;
        const operator = payload?.operator || null;

        if (data?.success === false || !operator) {
          console.warn('[POEKI detect] não identificada:', data);
          if (i < candidates.length - 1) await wait(700);
          continue;
        }

        return res.json({ operator, ...payload, attemptedPhones: candidates, usedPhone: phone });
      } catch (err) {
        lastError = err;
        console.warn('[POEKI detect] falha tentativa:', err.response?.data || err.message);
        if (i < candidates.length - 1) await wait(700);
      }
    }

    const msg = lastData?.message || lastError?.response?.data?.message || 'Operadora não identificada';
    return res.status(200).json({
      operator: null,
      message: msg,
      attemptedPhones: candidates,
      poeki_response: lastData || lastError?.response?.data || null,
    });
  } catch (err) {
    console.error('Detect error:', err.response?.data || err.message);
    const msg = err.response?.data?.message || 'Erro ao detectar operadora';
    res.status(200).json({ operator: null, message: msg });
  }
});

router.post('/check-phone', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber, carrierName } = req.body;
    logger.recarga.checkPhone(phoneNumber, carrierName, req.userId);
    const { data } = await axios.post(`${POEKI_URL}/utils/check-phone`, { phoneNumber, carrierName }, { headers: poekiHeaders() });
    const result = data.data || data;
    res.json({
      status: result.status,
      message: result.message || '',
      isCooldown: result.isCooldown || result.status === 'COOLDOWN',
      isBlacklisted: result.isBlacklisted || result.status === 'blacklisted',
    });
  } catch (err) {
    console.error('Check phone error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Erro ao verificar telefone' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { operadora_id, phone, plano_id } = req.body;

    const [planos] = await db.query('SELECT * FROM planos WHERE id = ?', [plano_id]);
    if (planos.length === 0) return res.status(404).json({ message: 'Plano não encontrado' });
    const plano = planos[0];

    // Garante que o plano pertence à operadora selecionada (evita enviar valor de Claro pra Vivo)
    if (Number(plano.operadora_id) !== Number(operadora_id)) {
      console.warn('[RECARGA] Plano/operadora mismatch:', { plano_id, plano_op: plano.operadora_id, operadora_id });
      return res.status(400).json({ message: 'Plano não pertence à operadora selecionada' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    const user = users[0];
    if (parseFloat(user.balance) < parseFloat(plano.cost)) {
      logger.recarga.insufficientBalance(req.userId, user.balance, plano.cost);
      return res.status(400).json({ message: 'Saldo insuficiente' });
    }

    const [ops] = await db.query('SELECT * FROM operadoras WHERE id = ?', [operadora_id]);
    if (ops.length === 0) return res.status(404).json({ message: 'Operadora não encontrada' });

    const idempotencyKey = `req_${uuidv4()}`;
    const webhookUrl = `${process.env.NGROK_URL}/api/webhooks/poeki`;

    const operatorName = ops[0].name.toLowerCase().trim();
    const payload = {
      operator: operatorName,
      phone,
      amount: parseFloat(plano.amount),
      webhookUrl,
      idempotencyKey,
    };
    console.log('[POEKI] POST /recharges payload:', JSON.stringify(payload));

    const { data: poekiRes } = await axios.post(`${POEKI_URL}/recharges`, payload, { headers: poekiHeaders() });
    const poekiData = poekiRes.data || poekiRes;

    await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [plano.cost, req.userId]);

    const [result] = await db.query(
      'INSERT INTO recargas (user_id, operadora_id, phone, amount, cost, status, poeki_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, operadora_id, phone, plano.amount, plano.cost, 'pendente', poekiData.id]
    );

    const [recargas] = await db.query('SELECT * FROM recargas WHERE id = ?', [result.insertId]);

    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.userId, 'recarga_created', `Recarga ${phone} R$ ${plano.amount}`]);

    logger.recarga.created(req.userId, user.username, phone, ops[0].name, plano.amount);

    res.json({ recarga: recargas[0] });
  } catch (err) {
    console.error('Recarga error:', err.response?.data || err.message);
    const poekiMsg = err.response?.data?.message;
    res.status(err.response?.status || 500).json({
      message: poekiMsg || 'Erro ao criar recarga',
    });
  }
});

// Helper: consulta Poeki para 1 recarga e atualiza DB. Retorna { recarga, changed, error }
async function syncOneRecarga(recarga) {
  if (!recarga.poeki_id) return { recarga, changed: false, error: 'no_poeki_id' };
  try {
    const { data } = await axios.get(`${POEKI_URL}/me/orders/${recarga.poeki_id}`, { headers: poekiHeaders(), timeout: 10000 });
    const poekiRaw = data.data || data;
    const poekiStatus = normalizeStatus(poekiRaw.status);
    if (!poekiStatus || poekiStatus === recarga.status) {
      return { recarga, changed: false, poekiStatus };
    }
    const wasFinal = ['feita', 'cancelada', 'expirada', 'reembolsado'].includes(recarga.status);
    await db.query('UPDATE recargas SET status = ? WHERE id = ?', [poekiStatus, recarga.id]);
    // Estorno apenas se ainda não era final (evita estornar duas vezes)
    if (!wasFinal && ['cancelada', 'expirada', 'reembolsado'].includes(poekiStatus)) {
      await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [recarga.cost, recarga.user_id]);
      await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [recarga.user_id, 'recarga_refund', `Estorno R$ ${recarga.cost} - Recarga ${poekiStatus} via sync (tel ${recarga.phone})`]);
    } else if (!wasFinal && poekiStatus === 'feita') {
      await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [recarga.user_id, 'recarga_completed', `Recarga concluída via sync: ${recarga.phone} R$ ${recarga.amount}`]);
    }
    recarga.status = poekiStatus;
    return { recarga, changed: true, poekiStatus };
  } catch (err) {
    console.warn('[POEKI sync] falha consulta id=' + recarga.id, err.response?.data || err.message);
    return { recarga, changed: false, error: 'poeki_unreachable' };
  }
}

// Reconsulta na Poeki TODAS as recargas (com poeki_id) do usuário — ou todas do sistema se admin
// Body opcional: { scope: 'mine' | 'all' }  (default: 'mine'). 'all' só para admin.
router.post('/sync-all', authMiddleware, async (req, res) => {
  try {
    const scope = req.body?.scope === 'all' && req.userRole === 'admin' && req.adminVerified ? 'all' : 'mine';
    const sql = scope === 'all'
      ? `SELECT r.*, o.name as operadora_name FROM recargas r
         JOIN operadoras o ON r.operadora_id = o.id
         WHERE r.poeki_id IS NOT NULL AND r.poeki_id <> ''
         ORDER BY r.created_at DESC`
      : `SELECT r.*, o.name as operadora_name FROM recargas r
         JOIN operadoras o ON r.operadora_id = o.id
         WHERE r.user_id = ? AND r.poeki_id IS NOT NULL AND r.poeki_id <> ''
         ORDER BY r.created_at DESC`;
    const params = scope === 'all' ? [] : [req.userId];
    const [rows] = await db.query(sql, params);

    let changed = 0;
    let errors = 0;
    // Sequencial para não martelar a Poeki
    for (const r of rows) {
      const out = await syncOneRecarga(r);
      if (out.changed) changed++;
      if (out.error === 'poeki_unreachable') errors++;
    }
    res.json({ scope, total: rows.length, changed, errors });
  } catch (err) {
    console.error('Sync-all error:', err);
    res.status(500).json({ message: 'Erro ao sincronizar todas as recargas' });
  }
});

// Sincroniza status com a Poeki ao vivo (consulta + atualiza DB se mudou)
router.get('/:id(\\d+)/sync', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, o.name as operadora_name FROM recargas r
       JOIN operadoras o ON r.operadora_id = o.id
       WHERE r.id = ? AND r.user_id = ?`,
      [req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Recarga não encontrada' });
    const recarga = rows[0];

    if (!recarga.poeki_id) {
      return res.json({ recarga, source: 'local', poekiStatus: null });
    }

    normalizeRecargaRow(recarga);
    const finalStates = ['feita', 'cancelada', 'expirada', 'reembolsado'];
    if (finalStates.includes(recarga.status)) {
      return res.json({ recarga, source: 'local-final', poekiStatus: recarga.status });
    }

    let poekiStatus = null;
    let poekiRaw = null;
    try {
      const { data } = await axios.get(`${POEKI_URL}/me/orders/${recarga.poeki_id}`, { headers: poekiHeaders(), timeout: 8000 });
      poekiRaw = data.data || data;
      poekiStatus = normalizeStatus(poekiRaw.status);
    } catch (err) {
      console.warn('[POEKI sync] falha consulta:', err.response?.data || err.message);
      return res.json({ recarga, source: 'local', poekiStatus: null, error: 'poeki_unreachable' });
    }

    // Se status mudou, atualiza local + estorno se necessário
    if (poekiStatus && poekiStatus !== recarga.status) {
      await db.query('UPDATE recargas SET status = ? WHERE id = ?', [poekiStatus, recarga.id]);
      if (['cancelada', 'expirada', 'reembolsado'].includes(poekiStatus)) {
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [recarga.cost, recarga.user_id]);
        await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
          [recarga.user_id, 'recarga_refund', `Estorno R$ ${recarga.cost} - Recarga ${poekiStatus} via sync (tel ${recarga.phone})`]);
      } else if (poekiStatus === 'feita') {
        await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
          [recarga.user_id, 'recarga_completed', `Recarga concluída via sync: ${recarga.phone} R$ ${recarga.amount}`]);
      }
      recarga.status = poekiStatus;
    }

    res.json({ recarga, source: 'poeki', poekiStatus, poekiRaw });
  } catch (err) {
    console.error('Sync recarga error:', err);
    res.status(500).json({ message: 'Erro ao sincronizar com Poeki' });
  }
});

router.get('/:id(\\d+)', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, o.name as operadora_name FROM recargas r
       JOIN operadoras o ON r.operadora_id = o.id
       WHERE r.id = ? AND r.user_id = ?`,
      [req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Recarga não encontrada' });
    res.json({ recarga: normalizeRecargaRow(rows[0]) });
  } catch (err) {
    console.error('Get recarga error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [recargas] = await db.query(
      `SELECT r.*, o.name as operadora_name FROM recargas r
       JOIN operadoras o ON r.operadora_id = o.id
       WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [req.userId, limit, offset]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM recargas WHERE user_id = ?', [req.userId]);

    res.json({ recargas: recargas.map(normalizeRecargaRow), total });
  } catch (err) {
    console.error('List recargas error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
