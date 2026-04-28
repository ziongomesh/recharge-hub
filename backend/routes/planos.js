const express = require('express');
const axios = require('axios');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const POEKI_URL = 'https://portal.poeki.dev/api/v2';
function poekiHeaders() {
  return { 'X-API-Key': process.env.POEKI_API_KEY, 'Content-Type': 'application/json' };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { operadora_id } = req.query;
    let query = 'SELECT * FROM planos';
    const params = [];
    if (operadora_id) { query += ' WHERE operadora_id = ?'; params.push(operadora_id); }
    query += ' ORDER BY amount ASC';
    const [planos] = await db.query(query, params);
    res.json({ planos });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Get Poeki API balance
router.get('/poeki-balance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!process.env.POEKI_API_KEY) {
      return res.status(500).json({ message: 'POEKI_API_KEY ausente no .env do backend' });
    }
    const { data } = await axios.get(`${POEKI_URL}/me/balance`, { headers: poekiHeaders() });
    res.json(data);
  } catch (err) {
    const status = err.response?.status;
    // Não expõe payload bruto da API parceira ao cliente
    const safeMsg = err.response?.data?.message || err.response?.data?.error || 'Falha ao consultar saldo';
    console.error('Provider balance error:', status, err.response?.data || err.message);
    res.status(500).json({ message: status ? `Provider ${status}: ${safeMsg}` : safeMsg });
  }
});

// Sync plans from Poeki catalog (preserves admin-defined price `amount`)
router.post('/sync', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data: response } = await axios.get(`${POEKI_URL}/catalog`, { headers: poekiHeaders() });
    const catalog = response.data || response;

    if (!Array.isArray(catalog)) {
      return res.status(500).json({ message: 'Resposta inesperada do catálogo Poeki' });
    }

    let updated = 0, created = 0;

    for (const entry of catalog) {
      const operatorName = entry.operator;
      const [ops] = await db.query('SELECT id FROM operadoras WHERE LOWER(name) = LOWER(?)', [operatorName]);
      if (ops.length === 0) continue;
      const operadora_id = ops[0].id;

      const values = entry.values || [];
      const poekiAmounts = values.map((v) => Number(v.amount));

      for (const v of values) {
        const amount = Number(v.amount);
        const cost = Number(v.cost);
        // UPSERT by (operadora_id, amount): keep admin price, only update cost
        const [existing] = await db.query(
          'SELECT id FROM planos WHERE operadora_id = ? AND amount = ?',
          [operadora_id, amount]
        );
        if (existing.length > 0) {
          await db.query('UPDATE planos SET cost = ? WHERE id = ?', [cost, existing[0].id]);
          updated++;
        } else {
          // New plan: default amount = cost (admin can edit later)
          await db.query('INSERT INTO planos (operadora_id, amount, cost) VALUES (?, ?, ?)',
            [operadora_id, amount, cost]);
          created++;
        }
      }

      // Remove planos that no longer exist in Poeki catalog for this operadora
      if (poekiAmounts.length > 0) {
        const placeholders = poekiAmounts.map(() => '?').join(',');
        await db.query(
          `DELETE FROM planos WHERE operadora_id = ? AND amount NOT IN (${placeholders})`,
          [operadora_id, ...poekiAmounts]
        );
      }
    }

    res.json({ message: `Sincronizado: ${created} novos, ${updated} atualizados`, synced: created + updated });
  } catch (err) {
    console.error('Sync catalog error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Erro ao sincronizar catálogo da Poeki' });
  }
});

// Apply markup % over cost for an operadora (or all): amount = cost * (1 + percent/100)
router.post('/markup', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { operadora_id, percent } = req.body;
    const pct = Number(percent);
    if (!Number.isFinite(pct)) return res.status(400).json({ message: 'percent inválido' });

    const multiplier = 1 + pct / 100;
    let result;
    if (operadora_id) {
      [result] = await db.query(
        'UPDATE planos SET amount = ROUND(cost * ?, 2) WHERE operadora_id = ?',
        [multiplier, operadora_id]
      );
    } else {
      [result] = await db.query('UPDATE planos SET amount = ROUND(cost * ?, 2)', [multiplier]);
    }
    res.json({ message: `Markup ${pct}% aplicado em ${result.affectedRows} planos`, affected: result.affectedRows });
  } catch (err) {
    console.error('Markup error:', err.message);
    res.status(500).json({ message: 'Erro ao aplicar markup' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { operadora_id, amount, cost } = req.body;
    const [result] = await db.query('INSERT INTO planos (operadora_id, amount, cost) VALUES (?, ?, ?)', [operadora_id, amount, cost]);
    const [rows] = await db.query('SELECT * FROM planos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount, cost } = req.body;
    await db.query('UPDATE planos SET amount = COALESCE(?, amount), cost = COALESCE(?, cost) WHERE id = ?', [amount, cost, req.params.id]);
    const [rows] = await db.query('SELECT * FROM planos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM planos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Plano removido' });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
