const express = require('express');
const db = require('../db');
const { authMiddleware, staffMiddleware } = require('../middleware/auth');

const router = express.Router();

// USUÁRIO: lista a sessão ativa dele (se houver) ou cria uma nova
router.post('/sessions', authMiddleware, async (req, res) => {
  try {
    const { pubkey } = req.body || {};
    if (!pubkey) return res.status(400).json({ message: 'pubkey obrigatória' });

    const [existing] = await db.query(
      "SELECT * FROM support_sessions WHERE user_id = ? AND status IN ('waiting','active') ORDER BY id DESC LIMIT 1",
      [req.userId]
    );
    if (existing.length > 0) {
      // Atualiza pubkey caso o cliente tenha gerado nova
      await db.query('UPDATE support_sessions SET user_pubkey = ? WHERE id = ?', [pubkey, existing[0].id]);
      return res.json({ session: { ...existing[0], user_pubkey: pubkey } });
    }
    const [r] = await db.query(
      "INSERT INTO support_sessions (user_id, status, user_pubkey) VALUES (?, 'waiting', ?)",
      [req.userId, pubkey]
    );
    const [rows] = await db.query('SELECT * FROM support_sessions WHERE id = ?', [r.insertId]);
    res.json({ session: rows[0] });
  } catch (err) {
    console.error('open session error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// USUÁRIO: histórico de mensagens da sua sessão (cifradas)
router.get('/sessions/:id/messages', authMiddleware, async (req, res) => {
  try {
    const [[s]] = await db.query('SELECT * FROM support_sessions WHERE id = ?', [req.params.id]);
    if (!s) return res.status(404).json({ message: 'Sessão não encontrada' });
    const isStaff = req.userRole === 'admin' || req.userRole === 'mod';
    if (s.user_id !== req.userId && !isStaff) return res.status(403).json({ message: 'Acesso negado' });
    const [msgs] = await db.query(
      'SELECT id, sender_role, ciphertext, iv, created_at FROM support_messages WHERE session_id = ? ORDER BY created_at ASC',
      [s.id]
    );
    res.json({ session: s, messages: msgs });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// STAFF: fila de sessões aguardando + ativas
router.get('/queue', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const [sessions] = await db.query(`
      SELECT s.*, u.username AS user_username, a.username AS agent_username
      FROM support_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users a ON s.agent_id = a.id
      WHERE s.status IN ('waiting','active')
      ORDER BY s.created_at ASC
    `);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
