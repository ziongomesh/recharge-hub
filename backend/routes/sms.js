const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { iconUrlFor } = require('../lib/sms-service-domains');

const router = express.Router();

const HERO_BASE = process.env.HERO_SMS_BASE_URL || 'https://hero-sms.com/stubs/handler_api.php';
const HERO_KEY = () => process.env.HERO_SMS_API_KEY || '';

// ---------- helpers ----------
async function heroGet(action, params = {}) {
  const key = HERO_KEY();
  if (!key) throw new Error('HERO_SMS_API_KEY não configurada no backend/.env');
  const qs = new URLSearchParams({ api_key: key, action, ...params });
  const url = `${HERO_BASE}?${qs.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  // hero-sms responde texto cru tipo "ACCESS_NUMBER:123:5511..." ou JSON. Tentamos JSON primeiro.
  try { return { json: JSON.parse(text), text }; }
  catch { return { json: null, text }; }
}

async function getConfig(key, fallback) {
  const [rows] = await db.query('SELECT v FROM sms_config WHERE k = ?', [key]);
  return rows[0]?.v ?? fallback;
}

async function rubToBrl() {
  const v = await getConfig('rub_to_brl', '0.06');
  return parseFloat(v) || 0.06;
}

function applyMarkup(costBrl, percent) {
  const p = parseFloat(percent) || 0;
  return Math.ceil(costBrl * (1 + p / 100) * 100) / 100; // arredonda pra cima 2 casas
}

// ---------- USER ----------

// Lista países habilitados
router.get('/countries', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, iso FROM sms_countries WHERE enabled = TRUE ORDER BY name'
    );
    res.json({ countries: rows });
  } catch (e) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Lista serviços com preço final (custo+markup) para um país
// Query: ?country=73
router.get('/services', authMiddleware, async (req, res) => {
  try {
    const country = parseInt(req.query.country ?? '0', 10);
    const rate = await rubToBrl();
    const [rows] = await db.query(
      `SELECT s.code, s.name, s.icon_url, s.default_markup_percent,
              p.cost AS cost_rub, p.count, p.markup_percent AS price_markup, p.enabled AS price_enabled
       FROM sms_services s
       LEFT JOIN sms_prices p ON p.service_code = s.code AND p.country_id = ?
       WHERE s.enabled = TRUE
       ORDER BY s.name`,
      [country]
    );
    const out = rows
      .filter((r) => r.cost_rub != null && r.price_enabled !== 0)
      .map((r) => {
        const costBrl = parseFloat(r.cost_rub) * rate;
        const markup = r.price_markup != null ? r.price_markup : r.default_markup_percent;
        return {
          code: r.code,
          name: r.name,
          icon_url: r.icon_url,
          stock: r.count || 0,
          price: applyMarkup(costBrl, markup),
        };
      });
    res.json({ services: out });
  } catch (e) {
    console.error('sms services:', e);
    res.status(500).json({ message: 'Erro ao listar serviços' });
  }
});

// Compra número
router.post('/buy', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { service, country } = req.body;
    if (!service || country == null) return res.status(400).json({ message: 'service e country obrigatórios' });

    await conn.beginTransaction();

    // Calcula preço atual
    const [[price]] = await conn.query(
      `SELECT p.cost, p.markup_percent, s.default_markup_percent, s.name AS sname
       FROM sms_prices p JOIN sms_services s ON s.code = p.service_code
       WHERE p.service_code = ? AND p.country_id = ? AND p.enabled = TRUE AND s.enabled = TRUE`,
      [service, country]
    ).then((r) => [r]);
    if (!price) { await conn.rollback(); return res.status(404).json({ message: 'Serviço/país indisponível' }); }

    const rate = await rubToBrl();
    const costBrl = parseFloat(price.cost) * rate;
    const markup = price.markup_percent != null ? price.markup_percent : price.default_markup_percent;
    const salePrice = applyMarkup(costBrl, markup);

    const [users] = await conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [req.userId]);
    if (parseFloat(users[0].balance) < salePrice) {
      await conn.rollback();
      return res.status(402).json({ message: 'Saldo insuficiente', insufficient: true });
    }

    const [[country_row]] = await conn.query('SELECT name FROM sms_countries WHERE id = ?', [country]).then((r) => [r]);

    // Chama hero-sms
    const { text } = await heroGet('getNumberV2', { service, country });
    // V2 retorna JSON: {activationId, phoneNumber, ...}; V1 retorna "ACCESS_NUMBER:id:phone"
    let heroId, phone;
    try {
      const j = JSON.parse(text);
      heroId = String(j.activationId || j.id);
      phone = String(j.phoneNumber || j.phone);
    } catch {
      const parts = text.split(':');
      if (parts[0] !== 'ACCESS_NUMBER') {
        await conn.rollback();
        return res.status(400).json({ message: `hero-sms: ${text}` });
      }
      heroId = parts[1];
      phone = parts[2];
    }

    await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [salePrice, req.userId]);

    const [ins] = await conn.query(
      `INSERT INTO sms_activations
        (user_id, hero_id, service_code, service_name, country_id, country_name, phone, cost, sale_price, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', DATE_ADD(NOW(), INTERVAL 20 MINUTE))`,
      [req.userId, heroId, service, price.sname, country, country_row?.name || null, phone, price.cost, salePrice]
    );
    await conn.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.userId, 'sms_buy', `${price.sname} ${country_row?.name || country} R$ ${salePrice}`]);
    await conn.commit();

    res.json({
      activation: {
        id: ins.insertId,
        hero_id: heroId,
        phone,
        service_code: service,
        service_name: price.sname,
        country_id: country,
        country_name: country_row?.name || null,
        sale_price: salePrice,
        status: 'waiting',
      },
    });
  } catch (e) {
    await conn.rollback();
    console.error('sms buy:', e);
    res.status(500).json({ message: e.message || 'Erro ao comprar número' });
  } finally {
    conn.release();
  }
});

// Status / poll
router.get('/activations/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sms_activations WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Não encontrada' });
    const a = rows[0];

    if (a.status === 'waiting') {
      // Consulta hero
      const { text } = await heroGet('getStatusV2', { id: a.hero_id });
      // V2 JSON: {status:"STATUS_OK", code:"123456", smsText:"..."} ou STATUS_WAIT_CODE
      let st = text;
      try {
        const j = JSON.parse(text);
        if (j.status === 'STATUS_OK') {
          await db.query(
            `UPDATE sms_activations SET status='received', sms_code=?, sms_text=? WHERE id=?`,
            [j.code || null, j.smsText || j.sms || null, a.id]
          );
          a.status = 'received';
          a.sms_code = j.code || null;
          a.sms_text = j.smsText || j.sms || null;
        } else if (j.status === 'STATUS_CANCEL') {
          a.status = 'canceled';
        }
      } catch {
        if (st.startsWith('STATUS_OK:')) {
          const code = st.replace('STATUS_OK:', '').trim();
          await db.query(`UPDATE sms_activations SET status='received', sms_code=?, sms_text=? WHERE id=?`, [code, code, a.id]);
          a.status = 'received';
          a.sms_code = code;
          a.sms_text = code;
        } else if (st === 'STATUS_CANCEL') {
          a.status = 'canceled';
        }
      }
    }
    res.json({ activation: a });
  } catch (e) {
    console.error('sms status:', e);
    res.status(500).json({ message: 'Erro' });
  }
});

// Cancelar (estorna se status=waiting e ainda permitido pela hero-sms — geralmente após 2min)
router.post('/activations/:id/cancel', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM sms_activations WHERE id = ? AND user_id = ? FOR UPDATE', [req.params.id, req.userId]);
    if (rows.length === 0) { await conn.rollback(); return res.status(404).json({ message: 'Não encontrada' }); }
    const a = rows[0];
    if (['canceled', 'finished', 'refunded'].includes(a.status)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Ativação já encerrada' });
    }
    // setStatus=8 = cancelar
    const { text } = await heroGet('setStatus', { id: a.hero_id, status: 8 });
    if (text !== 'ACCESS_CANCEL' && text !== 'ACCESS_ACTIVATION') {
      await conn.rollback();
      return res.status(400).json({ message: `hero-sms: ${text}` });
    }
    await conn.query('UPDATE sms_activations SET status=?, refunded=TRUE, finished_at=NOW() WHERE id=?',
      [a.sms_code ? 'finished' : 'canceled', a.id]);
    if (!a.refunded) {
      await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [a.sale_price, req.userId]);
      await conn.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [req.userId, 'sms_refund', `Estorno SMS #${a.id} R$ ${a.sale_price}`]);
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error('sms cancel:', e);
    res.status(500).json({ message: e.message || 'Erro' });
  } finally {
    conn.release();
  }
});

// Confirmar recebimento (setStatus=6 — finaliza ativação no fornecedor)
router.post('/activations/:id/finish', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sms_activations WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Não encontrada' });
    const a = rows[0];
    await heroGet('setStatus', { id: a.hero_id, status: 6 });
    await db.query("UPDATE sms_activations SET status='finished', finished_at=NOW() WHERE id=?", [a.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Minhas ativações ativas
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM sms_activations WHERE user_id = ? AND status IN ('waiting','received') ORDER BY created_at DESC",
      [req.userId]
    );
    res.json({ activations: rows });
  } catch (e) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Histórico
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sms_activations WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [req.userId]
    );
    res.json({ activations: rows });
  } catch (e) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Webhook (hero-sms POSTa quando SMS chega)
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    console.log('[SMS webhook]', ip, JSON.stringify(req.body));
    // body esperado: {activationId, service, text, code, country, ...}
    const heroId = String(req.body.activationId || req.body.id || '');
    const text = req.body.text || req.body.sms || null;
    const code = req.body.code || null;
    if (heroId) {
      await db.query(
        "UPDATE sms_activations SET status='received', sms_code=COALESCE(?, sms_code), sms_text=COALESCE(?, sms_text) WHERE hero_id=? AND status='waiting'",
        [code, text, heroId]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true }); // sempre 200 conforme docs
  }
});

// ---------- ADMIN ----------

router.get('/admin/balance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { text } = await heroGet('getBalance');
    // formato: "ACCESS_BALANCE:123.45"
    const balance = text.startsWith('ACCESS_BALANCE:') ? parseFloat(text.split(':')[1]) : null;
    res.json({ raw: text, balance });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Sincroniza serviços + países + preços (uma chamada que faz tudo)
router.post('/admin/sync-all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let services = 0, countries = 0, prices = 0;

    // Serviços
    {
      const { json } = await heroGet('getServicesList');
      // formato esperado: {status:"success", services:[{code,name,icon}]}
      const list = Array.isArray(json?.services) ? json.services : Array.isArray(json) ? json : [];
      for (const s of list) {
        const code = s.code || s.id || s.service;
        const name = s.name || s.title || code;
        const icon = iconUrlFor(code, name);
        if (!code) continue;
        await db.query(
          `INSERT INTO sms_services (code, name, icon_url) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), icon_url=VALUES(icon_url)`,
          [code, name, icon]
        );
        services++;
      }
    }

    // Países
    {
      const { json } = await heroGet('getCountries');
      // formato: {0: {id, rus, eng, chn}, 1: {...}} ou array
      const list = Array.isArray(json) ? json : Object.values(json || {});
      for (const c of list) {
        const id = c.id ?? c.country;
        const name = c.eng || c.name || c.rus || `País ${id}`;
        const iso = c.iso || c.iso_code || null;
        if (id == null) continue;
        await db.query(
          `INSERT INTO sms_countries (id, name, iso) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), iso=COALESCE(VALUES(iso), iso)`,
          [id, name, iso]
        );
        countries++;
      }
    }

    // Preços (getPrices retorna {countryId: {serviceCode: {cost, count}}})
    {
      const { json } = await heroGet('getPrices');
      if (json && typeof json === 'object') {
        for (const [cId, svcMap] of Object.entries(json)) {
          if (!svcMap || typeof svcMap !== 'object') continue;
          for (const [code, info] of Object.entries(svcMap)) {
            const cost = parseFloat(info?.cost ?? info?.price ?? 0);
            const count = parseInt(info?.count ?? 0, 10);
            await db.query(
              `INSERT INTO sms_prices (service_code, country_id, cost, count) VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE cost=VALUES(cost), count=VALUES(count)`,
              [code, parseInt(cId, 10), cost, count]
            );
            prices++;
          }
        }
      }
    }

    res.json({ ok: true, services, countries, prices });
  } catch (e) {
    console.error('sync-all:', e);
    res.status(500).json({ message: e.message });
  }
});

// Lista admin de serviços
router.get('/admin/services', authMiddleware, adminMiddleware, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM sms_services ORDER BY name');
  res.json({ services: rows });
});

router.put('/admin/services/:code', authMiddleware, adminMiddleware, async (req, res) => {
  const { enabled, default_markup_percent, name } = req.body;
  await db.query(
    'UPDATE sms_services SET enabled = COALESCE(?, enabled), default_markup_percent = COALESCE(?, default_markup_percent), name = COALESCE(?, name) WHERE code = ?',
    [enabled, default_markup_percent, name, req.params.code]
  );
  res.json({ ok: true });
});

// Lista admin de países
router.get('/admin/countries', authMiddleware, adminMiddleware, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM sms_countries ORDER BY name');
  res.json({ countries: rows });
});
router.put('/admin/countries/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { enabled } = req.body;
  await db.query('UPDATE sms_countries SET enabled = ? WHERE id = ?', [enabled !== false, req.params.id]);
  res.json({ ok: true });
});

// Override de markup por (serviço, país)
router.put('/admin/prices/:code/:countryId', authMiddleware, adminMiddleware, async (req, res) => {
  const { markup_percent, enabled } = req.body;
  await db.query(
    `UPDATE sms_prices SET markup_percent = ?, enabled = COALESCE(?, enabled)
     WHERE service_code = ? AND country_id = ?`,
    [markup_percent ?? null, enabled, req.params.code, parseInt(req.params.countryId, 10)]
  );
  res.json({ ok: true });
});

// Configurações (taxa de câmbio etc)
router.get('/admin/config', authMiddleware, adminMiddleware, async (req, res) => {
  const [rows] = await db.query('SELECT k, v FROM sms_config');
  res.json({ config: Object.fromEntries(rows.map((r) => [r.k, r.v])) });
});
router.put('/admin/config', authMiddleware, adminMiddleware, async (req, res) => {
  const entries = Object.entries(req.body || {});
  for (const [k, v] of entries) {
    await db.query(
      'INSERT INTO sms_config (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      [k, String(v)]
    );
  }
  res.json({ ok: true });
});

// Lista de ativações (admin)
router.get('/admin/activations', authMiddleware, adminMiddleware, async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.*, u.username
     FROM sms_activations a JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC LIMIT 200`
  );
  res.json({ activations: rows });
});

module.exports = router;
