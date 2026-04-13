const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, cpf } = req.body;
    if (!username || !email || !password || !phone || !cpf) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE username = ? OR email = ? OR cpf = ?', [username, email, cpf]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Usuário, email ou CPF já cadastrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, phone, cpf) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, phone, cpf]
    );

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = sanitizeUser(rows[0]);
    const token = generateToken(user);

    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [user.id, 'register', `Novo registro: ${username}`]);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'Usuário ou senha incorretos' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Usuário ou senha incorretos' });

    const token = generateToken(user);
    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [user.id, 'login', 'Login realizado']);

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json({ user: sanitizeUser(rows[0]) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
