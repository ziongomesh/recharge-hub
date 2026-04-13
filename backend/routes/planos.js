const express = require('express');
const axios = require('axios');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const POEKI_URL = 'https://portal.poeki.dev/api/v2';
function poekiHeaders() {
  return { 'X-API-Key': process.env.POEKI_API_KEY, 'Content-Type': 'application/json' };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { operadora_id } = req.query;
    let query = 'SELECT * FROM planos';
    const params = [];
    if (operadora_id) { query += ' WHERE operadora_id = ?'; params.push(operadora_id); }
    query += ' ORDER BY amount ASC';
    const [planos] = await db.query(query, params);
    res.json({ planos });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Sync plans from Poeki catalog
router.post('/sync', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data: response } = await axios.get(`${POEKI_URL}/catalog`, { headers: poekiHeaders() });
    const catalog = response.data || response;

    if (!Array.isArray(catalog)) {
      return res.status(500).json({ message: 'Resposta inesperada do catálogo Poeki' });
    }

    let synced = 0;

    for (const entry of catalog) {
      const operatorName = entry.operator;
      // Find local operadora by name (case-insensitive)
      const [ops] = await db.query('SELECT id FROM operadoras WHERE LOWER(name) = LOWER(?)', [operatorName]);
      if (ops.length === 0) continue;
      const operadora_id = ops[0].id;

      // Remove old plans for this operadora
      await db.query('DELETE FROM planos WHERE operadora_id = ?', [operadora_id]);

      // Insert new plans from catalog
      const values = entry.values || [];
      for (const v of values) {
        await db.query('INSERT INTO planos (operadora_id, amount, cost) VALUES (?, ?, ?)',
          [operadora_id, v.amount, v.cost]);
        synced++;
      }
    }

    res.json({ message: `Sincronizado: ${synced} planos atualizados`, synced });
  } catch (err) {
    console.error('Sync catalog error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Erro ao sincronizar catálogo da Poeki' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { operadora_id, amount, cost } = req.body;
    const [result] = await db.query('INSERT INTO planos (operadora_id, amount, cost) VALUES (?, ?, ?)', [operadora_id, amount, cost]);
    const [rows] = await db.query('SELECT * FROM planos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount, cost } = req.body;
    await db.query('UPDATE planos SET amount = COALESCE(?, amount), cost = COALESCE(?, cost) WHERE id = ?', [amount, cost, req.params.id]);
    const [rows] = await db.query('SELECT * FROM planos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM planos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Plano removido' });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
