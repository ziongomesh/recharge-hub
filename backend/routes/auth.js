const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

function generateToken(user, adminVerified = false) {
  return jwt.sign(
    { id: user.id, role: user.role, adminVerified },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user) {
  const { password, pin_hash, ...safe } = user;
  safe.pin_configured = !!pin_hash;
  if (safe.balance !== undefined) safe.balance = Number(safe.balance);
  return safe;
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, cpf } = req.body;
    if (!username || !email || !password || !phone || !cpf) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    const { isValidCPF, onlyDigits } = require('../lib/cpf');
    const cpfDigits = onlyDigits(cpf);
    if (!isValidCPF(cpfDigits)) {
      return res.status(400).json({ message: 'CPF inválido. Verifique os dígitos.' });
    }
    const phoneDigits = onlyDigits(phone);

    const [existing] = await db.query('SELECT id FROM users WHERE username = ? OR email = ? OR cpf = ?', [username, email, cpfDigits]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Usuário, email ou CPF já cadastrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, phone, cpf) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, phoneDigits, cpfDigits]
    );

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = sanitizeUser(rows[0]);

    const token = generateToken(user);

    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [user.id, 'register', `Novo registro: ${username}`]);

    logger.auth.register(username, email, phone, cpf);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginField = email || username;
    if (!loginField || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [loginField, loginField]);
    if (rows.length === 0) {
      logger.auth.loginFailed(loginField);
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.auth.loginFailed(loginField);
      return res.status(401).json({ message: 'Usuário ou senha incorretos' });
    }

    const token = generateToken(user);
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [user.id, 'login', 'Login realizado']);

    logger.auth.login(loginField, user.id);

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, phone, cpf, role, balance, created_at, last_login_at FROM users WHERE id = ?',
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
    const user = rows[0];
    logger.auth.me(user.id, user.username);
    res.json({ user, adminVerified: !!req.adminVerified });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Verifica PIN do admin → emite NOVO token com adminVerified=true
router.post('/verify-pin', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'mod') return res.status(403).json({ message: 'Apenas admin/moderador' });
    const { pin } = req.body || {};
    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ message: 'PIN deve ter 4 dígitos' });
    }
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
    const user = rows[0];
    if (!user.pin_hash) return res.status(428).json({ message: 'PIN ainda não cadastrado', setupRequired: true });

    const ok = await bcrypt.compare(String(pin), user.pin_hash);
    if (!ok) {
      await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [user.id, 'admin_pin_failed', 'Tentativa de PIN incorreta']);
      return res.status(401).json({ message: 'PIN incorreto' });
    }

    const token = generateToken(user, true);
    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'admin_pin_ok', 'Admin desbloqueou painel via PIN']);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Verify PIN error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Primeiro acesso admin/mod: cadastra PIN com bcrypt e libera o painel
router.post('/setup-pin', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'mod') return res.status(403).json({ message: 'Apenas admin/moderador' });
    const { pin, confirmPin } = req.body || {};
    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ message: 'PIN deve ter 4 dígitos' });
    }
    if (String(pin) !== String(confirmPin)) {
      return res.status(400).json({ message: 'Confirmação do PIN não confere' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
    const user = rows[0];
    if (user.pin_hash) return res.status(409).json({ message: 'PIN já cadastrado' });

    const hash = await bcrypt.hash(String(pin), 10);
    await db.query('UPDATE users SET pin_hash = ? WHERE id = ?', [hash, user.id]);
    user.pin_hash = hash;

    const token = generateToken(user, true);
    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'admin_pin_setup', 'Admin cadastrou PIN no primeiro acesso']);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Setup PIN error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Trocar PIN (precisa estar admin verificado)
router.post('/change-pin', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Apenas admins' });
    if (!req.adminVerified) return res.status(403).json({ message: 'Verifique o PIN atual primeiro' });
    const { newPin } = req.body || {};
    if (!newPin || !/^\d{4}$/.test(String(newPin))) {
      return res.status(400).json({ message: 'Novo PIN deve ter 4 dígitos' });
    }
    const hash = await bcrypt.hash(String(newPin), 10);
    await db.query('UPDATE users SET pin_hash = ? WHERE id = ?', [hash, req.userId]);
    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.userId, 'admin_pin_changed', 'Admin alterou seu PIN']);
    res.json({ message: 'PIN atualizado' });
  } catch (err) {
    console.error('Change PIN error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
