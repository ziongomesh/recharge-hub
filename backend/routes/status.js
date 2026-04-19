const express = require('express');
const axios = require('axios');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const POEKI_URL = 'https://portal.poeki.dev/api/v2';
const VIZZION_URL = 'https://app.vizzionpay.com.br/api/v1';
const HERO_URL = 'https://api.hero-sms.online/stubs/handler_api.php';

// Cache simples in-memory
let cache = { ts: 0, data: null };
const CACHE_MS = 30_000;

function vizKeys(mod) {
  const map = {
    recargas: ['VIZZION_RECARGAS_PUBLIC_KEY', 'VIZZION_RECARGAS_SECRET_KEY'],
    esim: ['VIZZION_ESIM_PUBLIC_KEY', 'VIZZION_ESIM_SECRET_KEY'],
    sms: ['VIZZION_SMS_PUBLIC_KEY', 'VIZZION_SMS_SECRET_KEY'],
  };
  const [p, s] = map[mod] || [];
  return {
    pub: (p && process.env[p]) || process.env.VIZZION_PUBLIC_KEY,
    sec: (s && process.env[s]) || process.env.VIZZION_SECRET_KEY,
  };
}

async function checkVizzion(mod) {
  const { pub, sec } = vizKeys(mod);
  if (!pub || !sec) return { ok: false, reason: 'sem chave' };
  const urls = [`${VIZZION_URL}/gateway/balance`, `${VIZZION_URL}/user/balance`, `${VIZZION_URL}/balance`];
  for (const url of urls) {
    try {
      await axios.get(url, { headers: { 'x-public-key': pub, 'x-secret-key': sec }, timeout: 5000 });
      return { ok: true };
    } catch (e) {
      if (e.response && e.response.status !== 404) return { ok: false, reason: `vizzion ${e.response.status}` };
    }
  }
  return { ok: false, reason: 'vizzion sem endpoint' };
}

async function checkPoeki() {
  if (!process.env.POEKI_API_KEY) return { ok: false, reason: 'sem chave' };
  try {
    await axios.get(`${POEKI_URL}/me/balance`, {
      headers: { 'X-API-Key': process.env.POEKI_API_KEY },
      timeout: 5000,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: `poeki ${e.response?.status || e.code || 'err'}` };
  }
}

async function checkHeroSms() {
  if (!process.env.HERO_SMS_API_KEY) return { ok: false, reason: 'sem chave' };
  try {
    const { data } = await axios.get(HERO_URL, {
      params: { api_key: process.env.HERO_SMS_API_KEY, action: 'getBalance' },
      timeout: 5000,
    });
    if (typeof data === 'string' && data.startsWith('ACCESS_BALANCE')) return { ok: true };
    return { ok: false, reason: 'hero resposta inválida' };
  } catch (e) {
    return { ok: false, reason: `hero ${e.response?.status || e.code || 'err'}` };
  }
}

async function buildStatus() {
  const [maintRows] = await db.query('SELECT module, maintenance FROM module_status');
  const maint = Object.fromEntries(maintRows.map((r) => [r.module, !!r.maintenance]));

  // Operadoras ativas pra recargas
  let operadoras = [];
  try {
    const [ops] = await db.query(
      "SELECT name FROM operadoras WHERE enabled = 1 AND poeki_allowed = 1 ORDER BY name"
    );
    operadoras = ops.map((o) => o.name);
  } catch {}

  const [poeki, vRec, vEsim, vSms, hero] = await Promise.all([
    checkPoeki(),
    checkVizzion('recargas'),
    checkVizzion('esim'),
    checkVizzion('sms'),
    checkHeroSms(),
  ]);

  const recargas = {
    maintenance: !!maint.recargas,
    apiOk: poeki.ok,
    paymentOk: vRec.ok,
    online: !maint.recargas && poeki.ok && vRec.ok,
    operadoras,
    reason: [poeki.ok ? null : `Poeki: ${poeki.reason}`, vRec.ok ? null : `Pagamento: ${vRec.reason}`].filter(Boolean).join(' · ') || null,
  };
  const sms = {
    maintenance: !!maint.sms,
    apiOk: hero.ok,
    paymentOk: vSms.ok,
    online: !maint.sms && hero.ok && vSms.ok,
    reason: [hero.ok ? null : `Hero-SMS: ${hero.reason}`, vSms.ok ? null : `Pagamento: ${vSms.reason}`].filter(Boolean).join(' · ') || null,
  };
  const esim = {
    maintenance: !!maint.esim,
    apiOk: true, // eSIM é estoque local
    paymentOk: vEsim.ok,
    online: !maint.esim && vEsim.ok,
    reason: vEsim.ok ? null : `Pagamento: ${vEsim.reason}`,
  };

  return { recargas, sms, esim, updatedAt: new Date().toISOString() };
}

// Status público (autenticado) — agrega tudo, com cache
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < CACHE_MS) {
      return res.json({ ...cache.data, cached: true });
    }
    const data = await buildStatus();
    cache = { ts: now, data };
    res.json(data);
  } catch (err) {
    console.error('status error:', err);
    res.status(500).json({ message: 'Erro ao obter status' });
  }
});

// Admin: lê os toggles
router.get('/admin/modules', authMiddleware, adminMiddleware, async (req, res) => {
  const [rows] = await db.query('SELECT module, maintenance, message, updated_at FROM module_status ORDER BY module');
  res.json({ modules: rows.map((r) => ({ ...r, maintenance: !!r.maintenance })) });
});

// Admin: toggle de manutenção
router.post('/admin/modules/:module', authMiddleware, adminMiddleware, async (req, res) => {
  const mod = String(req.params.module).toLowerCase();
  if (!['recargas', 'sms', 'esim'].includes(mod)) {
    return res.status(400).json({ message: 'Módulo inválido' });
  }
  const maintenance = req.body?.maintenance ? 1 : 0;
  const message = req.body?.message ?? null;
  await db.query(
    'INSERT INTO module_status (module, maintenance, message) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE maintenance = VALUES(maintenance), message = VALUES(message)',
    [mod, maintenance, message]
  );
  cache = { ts: 0, data: null }; // invalida cache
  res.json({ module: mod, maintenance: !!maintenance, message });
});

module.exports = router;
