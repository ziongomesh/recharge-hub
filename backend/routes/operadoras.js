const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [operadoras] = await db.query('SELECT * FROM operadoras ORDER BY name');
    res.json({ operadoras });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
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
