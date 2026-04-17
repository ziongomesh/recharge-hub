const express = require('express');
const axios = require('axios');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const POEKI_URL = 'https://portal.poeki.dev/api/v2';
const poekiHeaders = () => ({ 'X-API-Key': process.env.POEKI_API_KEY, 'Content-Type': 'application/json' });

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [operadoras] = await db.query('SELECT * FROM operadoras ORDER BY name');
    res.json({ operadoras });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Sincroniza o flag enabled local com o que a Poeki realmente libera para esta chave
router.post('/sync', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data } = await axios.get(`${POEKI_URL}/operators`, { headers: poekiHeaders() });
    const list = data.data || data;
    if (!Array.isArray(list)) return res.status(500).json({ message: 'Resposta inesperada da Poeki' });

    const poekiMap = new Map(list.map((o) => [String(o.operator).toLowerCase(), !!o.enabled]));
    const [locais] = await db.query('SELECT id, name FROM operadoras');
    for (const op of locais) {
      const enabled = poekiMap.get(String(op.name).toLowerCase()) === true;
      await db.query('UPDATE operadoras SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, op.id]);
    }
    res.json({ message: `Sincronizadas ${locais.length} operadoras com a Poeki`, poeki: list });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    res.status(500).json({ message: `Erro ao sincronizar com a Poeki: ${msg}` });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, enabled } = req.body;
    await db.query('UPDATE operadoras SET name = COALESCE(?, name), enabled = COALESCE(?, enabled) WHERE id = ?',
      [name, enabled, req.params.id]);
    const [rows] = await db.query('SELECT * FROM operadoras WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
