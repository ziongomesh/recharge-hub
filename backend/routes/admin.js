const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, phone, cpf, role, balance, created_at FROM users ORDER BY created_at DESC');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role, balance } = req.body;
    await db.query('UPDATE users SET role = COALESCE(?, role), balance = COALESCE(?, balance) WHERE id = ?',
      [role, balance, req.params.id]);
    const [rows] = await db.query('SELECT id, username, email, phone, cpf, role, balance, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuário removido' });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Recargas (all)
router.get('/recargas', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [recargas] = await db.query(
      `SELECT r.*, o.name as operadora_name, u.username FROM recargas r
       JOIN operadoras o ON r.operadora_id = o.id
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM recargas');
    res.json({ recargas, total });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Logs
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [logs] = await db.query(
      `SELECT l.*, u.username FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM activity_logs');
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
