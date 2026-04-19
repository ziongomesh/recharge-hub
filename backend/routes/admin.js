const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// =================== USERS ===================
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();
    const conds = [];
    const params = [];
    if (search) {
      conds.push('(username LIKE ? OR email LIKE ? OR phone LIKE ? OR cpf LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    if (role) { conds.push('role = ?'); params.push(role); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const [users] = await db.query(
      `SELECT id, username, email, phone, cpf, role, balance, created_at, last_login_at FROM users ${where} ORDER BY created_at DESC`,
      params
    );
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Staff (admin + mod) com last_login_at — separado pra aba dedicada
router.get('/staff', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, username, email, role, last_login_at, created_at FROM users
       WHERE role IN ('admin','mod')
       ORDER BY (role='admin') DESC, last_login_at DESC`
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role, balance, username, email, phone } = req.body;
    await db.query(
      `UPDATE users SET
        role     = COALESCE(?, role),
        balance  = COALESCE(?, balance),
        username = COALESCE(?, username),
        email    = COALESCE(?, email),
        phone    = COALESCE(?, phone)
       WHERE id = ?`,
      [role ?? null, balance ?? null, username ?? null, email ?? null, phone ?? null, req.params.id]
    );
    const [rows] = await db.query('SELECT id, username, email, phone, cpf, role, balance, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Erro interno' }); }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuário removido' });
  } catch (err) { res.status(500).json({ message: 'Erro interno' }); }
});

// Drilldown: detalhe completo de UM usuário (perfil + stats + recargas + depósitos + logs)
router.get('/users/:id/full', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[user]] = await db.query(
      'SELECT id, username, email, phone, cpf, role, balance, created_at, last_login_at FROM users WHERE id = ?',
      [id]
    );
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const [recargas] = await db.query(
      `SELECT r.*, o.name as operadora_name FROM recargas r
       JOIN operadoras o ON r.operadora_id = o.id
       WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 200`,
      [id]
    );
    const [pagamentos] = await db.query(
      'SELECT * FROM pagamentos WHERE user_id = ? ORDER BY created_at DESC LIMIT 200',
      [id]
    );
    const [logs] = await db.query(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 200',
      [id]
    );

    const [[stats]] = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM recargas WHERE user_id = ?) AS total_recargas,
         (SELECT COALESCE(SUM(amount),0) FROM recargas WHERE user_id = ? AND status='feita') AS total_recarregado,
         (SELECT COALESCE(SUM(cost),0) FROM recargas WHERE user_id = ? AND status='feita') AS total_gasto,
         (SELECT COUNT(*) FROM pagamentos WHERE user_id = ? AND status='paid') AS total_depositos,
         (SELECT COALESCE(SUM(amount),0) FROM pagamentos WHERE user_id = ? AND status='paid') AS total_depositado`,
      [id, id, id, id, id]
    );

    res.json({ user, stats, recargas, pagamentos, logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// =================== RECARGAS (filtráveis) ===================
router.get('/recargas', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const offset = (page - 1) * limit;
    const { status, user_id, operadora_id, from, to, search } = req.query;

    const conds = [];
    const params = [];
    if (status)        { conds.push('r.status = ?'); params.push(status); }
    if (user_id)       { conds.push('r.user_id = ?'); params.push(user_id); }
    if (operadora_id)  { conds.push('r.operadora_id = ?'); params.push(operadora_id); }
    if (from)          { conds.push('r.created_at >= ?'); params.push(from); }
    if (to)            { conds.push('r.created_at <= ?'); params.push(to); }
    if (search)        { conds.push('(u.username LIKE ? OR r.phone LIKE ?)'); const l = `%${search}%`; params.push(l, l); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [recargas] = await db.query(
      `SELECT r.*, o.name as operadora_name, u.username FROM recargas r
       JOIN operadoras o ON r.operadora_id = o.id
       JOIN users u ON r.user_id = u.id
       ${where}
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM recargas r JOIN users u ON r.user_id = u.id ${where}`,
      params
    );
    res.json({ recargas, total });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Erro interno' }); }
});

// =================== PAGAMENTOS / DEPÓSITOS ===================
router.get('/pagamentos', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const offset = (page - 1) * limit;
    const { status, user_id, from, to, search } = req.query;

    const conds = [];
    const params = [];
    if (status)   { conds.push('p.status = ?'); params.push(status); }
    if (user_id)  { conds.push('p.user_id = ?'); params.push(user_id); }
    if (from)     { conds.push('p.created_at >= ?'); params.push(from); }
    if (to)       { conds.push('p.created_at <= ?'); params.push(to); }
    if (search)   { conds.push('(u.username LIKE ? OR p.transaction_id LIKE ?)'); const l = `%${search}%`; params.push(l, l); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [pagamentos] = await db.query(
      `SELECT p.*, u.username FROM pagamentos p
       JOIN users u ON p.user_id = u.id
       ${where}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM pagamentos p JOIN users u ON p.user_id = u.id ${where}`,
      params
    );
    res.json({ pagamentos, total });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Erro interno' }); }
});

// =================== LOGS ===================
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = (page - 1) * limit;
    const { user_id, action, search } = req.query;

    const conds = [];
    const params = [];
    if (user_id) { conds.push('l.user_id = ?'); params.push(user_id); }
    if (action)  { conds.push('l.action = ?'); params.push(action); }
    if (search)  { conds.push('(u.username LIKE ? OR l.details LIKE ?)'); const l = `%${search}%`; params.push(l, l); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [logs] = await db.query(
      `SELECT l.*, u.username FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${where}
       ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id ${where}`,
      params
    );
    res.json({ logs, total });
  } catch (err) { res.status(500).json({ message: 'Erro interno' }); }
});

// =================== DASHBOARD / STATS ===================
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) AS users_today,
        (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS users_week,
        (SELECT COUNT(*) FROM recargas) AS total_recargas,
        (SELECT COUNT(*) FROM recargas WHERE DATE(created_at) = CURDATE()) AS recargas_today,
        (SELECT COUNT(*) FROM recargas WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS recargas_week,
        (SELECT COUNT(*) FROM recargas WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS recargas_month,
        (SELECT COALESCE(SUM(amount),0) FROM recargas WHERE status='feita' AND DATE(created_at)=CURDATE()) AS volume_today,
        (SELECT COALESCE(SUM(amount),0) FROM recargas WHERE status='feita' AND created_at>=DATE_SUB(NOW(),INTERVAL 7 DAY)) AS volume_week,
        (SELECT COALESCE(SUM(amount),0) FROM recargas WHERE status='feita' AND created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)) AS volume_month,
        (SELECT COALESCE(SUM(amount-cost),0) FROM recargas WHERE status='feita' AND created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)) AS profit_month,
        (SELECT COUNT(*) FROM recargas WHERE status='pendente' OR status='andamento') AS recargas_pendentes,
        (SELECT COALESCE(SUM(amount),0) FROM pagamentos WHERE status='paid' AND DATE(created_at)=CURDATE()) AS depositos_today,
        (SELECT COALESCE(SUM(amount),0) FROM pagamentos WHERE status='paid' AND created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)) AS depositos_month,
        (SELECT COUNT(*) FROM pagamentos WHERE status='pending') AS depositos_pendentes,
        (SELECT COALESCE(SUM(balance),0) FROM users) AS total_balance
    `);

    // Distribuição por status
    const [statusBreakdown] = await db.query(
      `SELECT status, COUNT(*) AS count FROM recargas GROUP BY status`
    );

    // Top 10 usuários por volume (últimos 30d)
    const [topRecarregadores] = await db.query(`
      SELECT u.id, u.username, COUNT(r.id) AS qtd, COALESCE(SUM(r.amount),0) AS total
      FROM recargas r JOIN users u ON r.user_id = u.id
      WHERE r.status='feita' AND r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY u.id ORDER BY total DESC LIMIT 10
    `);

    // Top 10 usuários por quantidade de pedidos (qualquer status, 30d)
    const [topPedidos] = await db.query(`
      SELECT u.id, u.username, COUNT(r.id) AS qtd
      FROM recargas r JOIN users u ON r.user_id = u.id
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY u.id ORDER BY qtd DESC LIMIT 10
    `);

    // Últimos cadastros (24h)
    const [latestUsers] = await db.query(`
      SELECT id, username, email, created_at FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY created_at DESC LIMIT 20
    `);

    // Série diária últimos 14 dias (volume)
    const [dailyVolume] = await db.query(`
      SELECT DATE(created_at) AS dia,
             COUNT(*) AS qtd,
             COALESCE(SUM(CASE WHEN status='feita' THEN amount ELSE 0 END),0) AS volume
      FROM recargas
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      GROUP BY DATE(created_at)
      ORDER BY dia ASC
    `);

    // Por operadora (30d)
    const [byOperadora] = await db.query(`
      SELECT o.name, COUNT(r.id) AS qtd, COALESCE(SUM(CASE WHEN r.status='feita' THEN r.amount ELSE 0 END),0) AS volume
      FROM recargas r JOIN operadoras o ON r.operadora_id = o.id
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY o.id ORDER BY volume DESC
    `);

    res.json({
      totals,
      statusBreakdown,
      topRecarregadores,
      topPedidos,
      latestUsers,
      dailyVolume,
      byOperadora,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Erro ao calcular estatísticas' });
  }
});

module.exports = router;
