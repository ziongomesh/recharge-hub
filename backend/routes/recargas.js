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

router.post('/detect', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    logger.recarga.detect(phone, req.userId);
    const { data } = await axios.post(`${POEKI_URL}/detect-operator`, { phone }, { headers: poekiHeaders() });
    res.json(data.data || data);
  } catch (err) {
    console.error('Detect error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Erro ao detectar operadora' });
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

router.get('/:id(\\d+)', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, o.name as operadora_name FROM recargas r
       JOIN operadoras o ON r.operadora_id = o.id
       WHERE r.id = ? AND r.user_id = ?`,
      [req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Recarga não encontrada' });
    res.json({ recarga: rows[0] });
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

    res.json({ recargas, total });
  } catch (err) {
    console.error('List recargas error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
