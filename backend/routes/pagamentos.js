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

    // Valida configuração do provedor PIX antes de tentar
    if (!process.env.VIZZION_PUBLIC_KEY || !process.env.VIZZION_SECRET_KEY) {
      console.error('[Deposit] Chaves do provedor PIX ausentes no .env (VIZZION_PUBLIC_KEY / VIZZION_SECRET_KEY)');
      return res.status(500).json({ message: 'Provedor de pagamento não configurado. Contate o suporte.' });
    }

    const [users] = await db.query('SELECT id, username, email, phone, cpf FROM users WHERE id = ?', [req.userId]);
    const user = users[0];
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const { isValidCPF, onlyDigits } = require('../lib/cpf');
    const cpfDigits = onlyDigits(user.cpf);
    if (!isValidCPF(cpfDigits)) {
      return res.status(400).json({ message: 'CPF inválido ou não cadastrado. Atualize seu perfil antes de gerar PIX.' });
    }

    const phoneDigits = onlyDigits(user.phone) || '11999999999';

    const identifier = uuidv4();
    const baseUrl = process.env.PUBLIC_BASE_URL || process.env.NGROK_URL || '';
    const callbackUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/webhooks/vizzion` : undefined;

    const payload = {
      identifier,
      amount: parseFloat(amount),
      client: {
        name: user.username || 'Cliente',
        email: user.email || 'noreply@cometasms.com',
        phone: phoneDigits,
        document: cpfDigits,
      },
    };
    if (callbackUrl) payload.callbackUrl = callbackUrl;

    let data;
    try {
      const resp = await axios.post(`${VIZZION_URL}/gateway/pix/receive`, payload, {
        headers: {
          'x-public-key': process.env.VIZZION_PUBLIC_KEY,
          'x-secret-key': process.env.VIZZION_SECRET_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      data = resp.data;
    } catch (apiErr) {
      const status = apiErr.response?.status;
      const body = apiErr.response?.data;
      console.error('[Deposit] Provedor PIX falhou:', { status, body, message: apiErr.message });
      const detail = body?.message || body?.error || apiErr.message || 'sem detalhes';
      return res.status(502).json({ message: `Provedor PIX recusou (${status || 'sem status'}): ${detail}` });
    }

    const txId = data?.transactionId;
    if (!txId) {
      console.error('[Deposit] Provedor PIX não retornou transactionId. Resposta:', data);
      return res.status(502).json({ message: 'Provedor PIX retornou resposta inválida.' });
    }

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
    console.error('Deposit error:', err.message);
    res.status(500).json({ message: 'Erro interno ao gerar PIX' });
  }
});

router.get('/status/:txId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pagamentos WHERE transaction_id = ?', [req.params.txId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Pagamento não encontrado' });
    const pagamento = rows[0];

    // VizzionPay BLOQUEIA polling. Status é atualizado exclusivamente via webhook
    // (POST /api/webhooks/vizzion). Aqui apenas lemos o estado atual do banco.

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

// Resolve as keys conforme módulo (?module=recargas|esim|sms). Falta -> fallback global.
function resolveVizzionKeys(mod) {
  const map = {
    recargas: ['VIZZION_RECARGAS_PUBLIC_KEY', 'VIZZION_RECARGAS_SECRET_KEY'],
    esim:     ['VIZZION_ESIM_PUBLIC_KEY',     'VIZZION_ESIM_SECRET_KEY'],
    sms:      ['VIZZION_SMS_PUBLIC_KEY',      'VIZZION_SMS_SECRET_KEY'],
  };
  const [pubName, secName] = map[mod] || [];
  const pub = (pubName && process.env[pubName]) || process.env.VIZZION_PUBLIC_KEY;
  const sec = (secName && process.env[secName]) || process.env.VIZZION_SECRET_KEY;
  const usingFallback = !(pubName && process.env[pubName] && process.env[secName]);
  return { pub, sec, usingFallback, pubName, secName };
}

router.get('/admin/balance', authMiddleware, adminMiddleware, async (req, res) => {
  const mod = String(req.query.module || '').toLowerCase();
  const { pub, sec, usingFallback, pubName, secName } = resolveVizzionKeys(mod);
  if (!pub || !sec) {
    return res.status(500).json({
      message: mod
        ? `Configure ${pubName}/${secName} no .env do backend (módulo ${mod})`
        : 'VIZZION_PUBLIC_KEY/SECRET_KEY ausentes no .env do backend',
    });
  }
  const headers = { 'x-public-key': pub, 'x-secret-key': sec };
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
      const available = Number(
        data?.availableBalance ?? data?.balance ?? data?.available ??
        data?.data?.availableBalance ?? data?.data?.balance ??
        data?.user?.balance ?? 0
      );
      const blocked = Number(
        data?.blockedBalance ?? data?.blocked ?? data?.data?.blockedBalance ?? 0
      );
      return res.json({ balance: available, blocked, module: mod || null, usingFallback, source: url, raw: data });
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;
      errors.push({ url, status, body: typeof body === 'string' ? body.slice(0, 200) : body });
      if (status && status !== 404) {
        const msg = body?.message || body?.error || err.message;
        return res.status(500).json({ message: `VizzionPay ${status}: ${msg}`, source: url, module: mod || null });
      }
    }
  }
  console.error('[VizzionPay balance] todos paths falharam:', errors);
  res.status(502).json({
    message: 'Endpoint de saldo não encontrado na VizzionPay (testei /gateway/balance, /user/balance, /balance, /account/balance).',
    tried: errors,
    module: mod || null,
  });
});

module.exports = router;
