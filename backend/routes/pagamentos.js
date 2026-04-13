const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

const VIZZION_URL = 'https://app.vizzionpay.com.br/api/v1';

router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: 'Valor mínimo: R$ 1,00' });

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    const user = users[0];

    const identifier = uuidv4();
    const callbackUrl = `${process.env.NGROK_URL}/api/webhooks/vizzion`;

    const { data } = await axios.post(`${VIZZION_URL}/gateway/pix/receive`, {
      identifier,
      amount: parseFloat(amount),
      client: {
        name: user.username,
        email: user.email,
        phone: user.phone,
        document: user.cpf,
      },
      callbackUrl,
    }, {
      headers: {
        'x-public-key': process.env.VIZZION_PUBLIC_KEY,
        'x-secret-key': process.env.VIZZION_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    const txId = data.transactionId;

    await db.query(
      'INSERT INTO pagamentos (user_id, transaction_id, amount, status) VALUES (?, ?, ?, ?)',
      [req.userId, txId, amount, 'pending']
    );

    const [pagamentos] = await db.query('SELECT * FROM pagamentos WHERE transaction_id = ?', [txId]);

    await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.userId, 'deposit_created', `PIX R$ ${amount} - TX: ${txId}`]);

    logger.pagamento.pixGenerated(req.userId, user.username, amount, txId);

    res.json({
      pagamento: pagamentos[0],
      qrCode: data.pix?.image || '',
      qrCodeBase64: data.pix?.base64 || '',
      pixCopiaECola: data.pix?.code || '',
    });
  } catch (err) {
    console.error('Deposit error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Erro ao gerar PIX' });
  }
});

router.get('/status/:txId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pagamentos WHERE transaction_id = ?', [req.params.txId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Pagamento não encontrado' });
    logger.pagamento.statusCheck(req.params.txId, rows[0].status);
    res.json({ status: rows[0].status, pagamento: rows[0] });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [pagamentos] = await db.query(
      'SELECT * FROM pagamentos WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.userId, limit, offset]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM pagamentos WHERE user_id = ?', [req.userId]);

    res.json({ pagamentos, total });
  } catch (err) {
    console.error('List pagamentos error:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
