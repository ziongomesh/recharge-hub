const express = require('express');
const db = require('../db');

const router = express.Router();

// VizzionPay webhook - pagamento PIX confirmado
router.post('/vizzion/:identifier', async (req, res) => {
  try {
    const { event, transaction } = req.body;
    console.log(`[Webhook VizzionPay] event=${event} identifier=${req.params.identifier}`);

    if (event === 'TRANSACTION_PAID' && transaction) {
      const txId = transaction.id || req.params.identifier;

      const [pagamentos] = await db.query('SELECT * FROM pagamentos WHERE transaction_id = ?', [txId]);
      if (pagamentos.length === 0) {
        // Try by identifier
        const [byIdent] = await db.query('SELECT * FROM pagamentos WHERE transaction_id = ?', [req.params.identifier]);
        if (byIdent.length === 0) return res.status(404).json({ message: 'Pagamento não encontrado' });
        
        await db.query('UPDATE pagamentos SET status = ? WHERE id = ?', ['confirmed', byIdent[0].id]);
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [byIdent[0].amount, byIdent[0].user_id]);
        await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
          [byIdent[0].user_id, 'deposit_confirmed', `PIX confirmado R$ ${byIdent[0].amount}`]);
      } else {
        await db.query('UPDATE pagamentos SET status = ? WHERE id = ?', ['confirmed', pagamentos[0].id]);
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [pagamentos[0].amount, pagamentos[0].user_id]);
        await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
          [pagamentos[0].user_id, 'deposit_confirmed', `PIX confirmado R$ ${pagamentos[0].amount}`]);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('VizzionPay webhook error:', err);
    res.status(500).json({ message: 'Erro no webhook' });
  }
});

// Poeki webhook - status de recarga
router.post('/poeki', async (req, res) => {
  try {
    const { id, status, cost } = req.body;
    console.log(`[Webhook Poeki] id=${id} status=${status}`);

    if (!id || !status) return res.status(400).json({ message: 'Dados incompletos' });

    const [recargas] = await db.query('SELECT * FROM recargas WHERE poeki_id = ?', [id]);
    if (recargas.length === 0) return res.status(404).json({ message: 'Recarga não encontrada' });

    const recarga = recargas[0];
    await db.query('UPDATE recargas SET status = ? WHERE id = ?', [status, recarga.id]);

    // Se cancelada/expirada, devolver saldo
    if (status === 'cancelada' || status === 'expirada') {
      await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [recarga.cost, recarga.user_id]);
      await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [recarga.user_id, 'recarga_refund', `Estorno R$ ${recarga.cost} - Recarga ${status}`]);
    }

    if (status === 'feita') {
      await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [recarga.user_id, 'recarga_completed', `Recarga concluída: ${recarga.phone} R$ ${recarga.amount}`]);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Poeki webhook error:', err);
    res.status(500).json({ message: 'Erro no webhook' });
  }
});

module.exports = router;
