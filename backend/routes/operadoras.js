const express = require('express');
const axios = require('axios');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const POEKI_URL = 'https://portal.poeki.dev/api/v2';
const poekiHeaders = () => ({ 'X-API-Key': process.env.POEKI_API_KEY, 'Content-Type': 'application/json' });

router.get('/', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const where = isAdmin ? '' : 'WHERE poeki_allowed = 1 AND enabled = 1';
    const [operadoras] = await db.query(`SELECT * FROM operadoras ${where} ORDER BY name`);
    res.json({ operadoras });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/sync', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data } = await axios.get(`${POEKI_URL}/operators`, { headers: poekiHeaders() });
    console.log('[POEKI /operators] resposta crua:', JSON.stringify(data, null, 2));
    const list = data.data || data;
    if (!Array.isArray(list)) {
      console.error('[POEKI /operators] resposta inesperada:', data);
      return res.status(500).json({ message: 'Resposta inesperada da Poeki', poeki_response: data });
    }

    const allowedNames = list
      .filter((o) => o.enabled !== false)
      .map((o) => String(o.operator).toLowerCase());

    console.log('[POEKI /operators] operadoras autorizadas:', allowedNames);

    for (const name of allowedNames) {
      await db.query(
        `INSERT INTO operadoras (name, enabled, poeki_allowed) VALUES (?, 0, 1)
         ON DUPLICATE KEY UPDATE poeki_allowed = 1`,
        [name]
      );
    }

    if (allowedNames.length > 0) {
      const placeholders = allowedNames.map(() => '?').join(',');
      await db.query(
        `UPDATE operadoras SET poeki_allowed = 0, enabled = 0
         WHERE LOWER(name) NOT IN (${placeholders})`,
        allowedNames
      );
    } else {
      await db.query(`UPDATE operadoras SET poeki_allowed = 0, enabled = 0`);
    }

    const [locais] = await db.query('SELECT id, name, poeki_allowed, enabled FROM operadoras ORDER BY name');
    console.log('[POEKI /operators] operadoras no banco após sync:', locais);

    res.json({
      message: `Sincronizado: ${allowedNames.length} operadora(s) autorizada(s) pela Poeki`,
      operadoras: locais,
      poeki_raw: data,
      poeki_allowed: allowedNames,
    });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('[POEKI /operators] erro:', err.response?.status, err.response?.data || err.message);
    res.status(500).json({
      message: `Erro ao sincronizar com a Poeki: ${msg}`,
      poeki_status: err.response?.status,
      poeki_response: err.response?.data,
    });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, enabled } = req.body;

    if (enabled === true || enabled === 1) {
      const [[op]] = await db.query('SELECT poeki_allowed FROM operadoras WHERE id = ?', [req.params.id]);
      if (!op) return res.status(404).json({ message: 'Operadora não encontrada' });
      if (!op.poeki_allowed) {
        return res.status(403).json({
          message: 'Esta operadora não está autorizada pela sua chave Poeki. Sincronize primeiro.',
        });
      }
    }

    await db.query(
      'UPDATE operadoras SET name = COALESCE(?, name), enabled = COALESCE(?, enabled) WHERE id = ?',
      [name ?? null, enabled ?? null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM operadoras WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
