const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [noticias] = await db.query('SELECT * FROM noticias ORDER BY pinned DESC, created_at DESC');
    res.json({ noticias });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, content, pinned } = req.body;
    const [users] = await db.query('SELECT username FROM users WHERE id = ?', [req.userId]);
    const [result] = await db.query(
      'INSERT INTO noticias (title, content, pinned, author) VALUES (?, ?, ?, ?)',
      [title, content, pinned || false, users[0].username]
    );
    const [rows] = await db.query('SELECT * FROM noticias WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, content, pinned } = req.body;
    await db.query('UPDATE noticias SET title = COALESCE(?, title), content = COALESCE(?, content), pinned = COALESCE(?, pinned) WHERE id = ?',
      [title, content, pinned, req.params.id]);
    const [rows] = await db.query('SELECT * FROM noticias WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM noticias WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notícia removida' });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
