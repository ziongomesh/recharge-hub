const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { operadora_id } = req.query;
    let query = 'SELECT * FROM planos';
    const params = [];
    if (operadora_id) { query += ' WHERE operadora_id = ?'; params.push(operadora_id); }
    const [planos] = await db.query(query, params);
    res.json({ planos });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
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
