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
    let pagamento = rows[0];

    // Se ainda pendente, consulta a VizzionPay diretamente (fallback caso webhook não tenha chegado)
    if (pagamento.status === 'pending') {
      try {
        const { data } = await axios.get(`${VIZZION_URL}/gateway/transactions?id=${encodeURIComponent(req.params.txId)}`, {
          headers: {
            'x-public-key': process.env.VIZZION_PUBLIC_KEY,
            'x-secret-key': process.env.VIZZION_SECRET_KEY,
          },
        });

        // Resposta pode vir como objeto único ou array
        const tx = Array.isArray(data) ? data[0] : (data?.transaction || data);
        const vizzionStatus = (tx?.status || '').toUpperCase();

        if (vizzionStatus === 'APPROVED' || vizzionStatus === 'PAID' || vizzionStatus === 'COMPLETED') {
          await db.query('UPDATE pagamentos SET status = ? WHERE id = ?', ['paid', pagamento.id]);
          await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [pagamento.amount, pagamento.user_id]);
          await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [pagamento.user_id, 'deposit_confirmed_polling', `PIX confirmado via polling R$ ${pagamento.amount}`]);
          logger.webhook?.vizzionConfirmed?.(pagamento.user_id, pagamento.amount);
          pagamento = { ...pagamento, status: 'paid' };
        } else if (vizzionStatus === 'REFUSED' || vizzionStatus === 'CANCELLED' || vizzionStatus === 'EXPIRED' || vizzionStatus === 'FAILED') {
          await db.query('UPDATE pagamentos SET status = ? WHERE id = ?', ['failed', pagamento.id]);
          pagamento = { ...pagamento, status: 'failed' };
        }
      } catch (vErr) {
        console.error('Vizzion status poll error:', vErr.response?.data || vErr.message);
      }
    }

    logger.pagamento.statusCheck(req.params.txId, pagamento.status);
    res.json({ status: pagamento.status, pagamento });
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

// ---- ADMIN: saldo da conta VizzionPay ----
const { adminMiddleware } = require('../middleware/auth');
router.get('/admin/balance', authMiddleware, adminMiddleware, async (req, res) => {
  if (!process.env.VIZZION_PUBLIC_KEY || !process.env.VIZZION_SECRET_KEY) {
    return res.status(500).json({ message: 'VIZZION_PUBLIC_KEY/SECRET_KEY ausentes no .env do backend' });
  }
  const headers = {
    'x-public-key': process.env.VIZZION_PUBLIC_KEY,
    'x-secret-key': process.env.VIZZION_SECRET_KEY,
  };
  // Tenta múltiplos paths conhecidos da VizzionPay (a doc varia entre versões)
  const candidates = [
    `${VIZZION_URL}/gateway/balance`,
    `${VIZZION_URL}/user/balance`,
    `${VIZZION_URL}/balance`,
    `${VIZZION_URL}/account/balance`,
  ];
  const errors = [];
  for (const url of candidates) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 8000 });
      // Extrai saldo de qualquer formato comum
      const available = Number(
        data?.availableBalance ??
        data?.balance ??
        data?.available ??
        data?.data?.availableBalance ??
        data?.data?.balance ??
        data?.user?.balance ??
        0
      );
      const blocked = Number(
        data?.blockedBalance ??
        data?.blocked ??
        data?.data?.blockedBalance ??
        0
      );
      logger?.info?.(`[VizzionPay balance] OK via ${url}`);
      return res.json({ balance: available, blocked, source: url, raw: data });
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;
      errors.push({ url, status, body: typeof body === 'string' ? body.slice(0, 200) : body });
      // Só continua tentando se for 404 — outros erros (401/403/500) param na hora
      if (status && status !== 404) {
        const msg = body?.message || body?.error || err.message;
        return res.status(500).json({ message: `VizzionPay ${status}: ${msg}`, source: url });
      }
    }
  }
  console.error('[VizzionPay balance] todos paths falharam:', errors);
  res.status(502).json({
    message: 'Endpoint de saldo não encontrado na VizzionPay (testei /gateway/balance, /user/balance, /balance, /account/balance). Confirme o path correto na sua doc.',
    tried: errors,
  });
});

module.exports = router;
