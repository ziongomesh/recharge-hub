const express = require('express');
const db = require('../db');
const logger = require('../logger');

const router = express.Router();

// VizzionPay webhook - URL fixa (limite de 20 webhooks)
router.post('/vizzion', async (req, res) => {
  try {
    const { event, transaction } = req.body;
    const txId = transaction?.id || '';
    logger.webhook.vizzionReceived(event, txId);

    if (event === 'TRANSACTION_PAID' && transaction) {
      // Buscar por transactionId ou identifier
      let pagamento = null;
      const [byTx] = await db.query('SELECT * FROM pagamentos WHERE transaction_id = ?', [txId]);
      if (byTx.length > 0) {
        pagamento = byTx[0];
      } else if (transaction.clientIdentifier) {
        const [byIdent] = await db.query('SELECT * FROM pagamentos WHERE transaction_id = ?', [transaction.clientIdentifier]);
        if (byIdent.length > 0) pagamento = byIdent[0];
      }

      if (!pagamento) return res.status(404).json({ message: 'Pagamento não encontrado' });

      if (pagamento.status !== 'paid') {
        await db.query('UPDATE pagamentos SET status = ? WHERE id = ?', ['paid', pagamento.id]);
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [pagamento.amount, pagamento.user_id]);
        await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
          [pagamento.user_id, 'deposit_confirmed', `PIX confirmado R$ ${pagamento.amount}`]);
        logger.webhook.vizzionConfirmed(pagamento.user_id, pagamento.amount);
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
    logger.webhook.poekiReceived(id, status);

    if (!id || !status) return res.status(400).json({ message: 'Dados incompletos' });

    const [recargas] = await db.query('SELECT * FROM recargas WHERE poeki_id = ?', [id]);
    if (recargas.length === 0) return res.status(404).json({ message: 'Recarga não encontrada' });

    const recarga = recargas[0];
    await db.query('UPDATE recargas SET status = ? WHERE id = ?', [status, recarga.id]);

    if (status === 'cancelada' || status === 'expirada') {
      await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [recarga.cost, recarga.user_id]);
      await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [recarga.user_id, 'recarga_refund', `Estorno R$ ${recarga.cost} - Recarga ${status}`]);
      logger.webhook.recargaRefunded(recarga.user_id, recarga.cost, status);
    }

    if (status === 'feita') {
      await db.query('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [recarga.user_id, 'recarga_completed', `Recarga concluída: ${recarga.phone} R$ ${recarga.amount}`]);
      logger.webhook.recargaCompleted(recarga.user_id, recarga.phone, recarga.amount);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Poeki webhook error:', err);
    res.status(500).json({ message: 'Erro no webhook' });
  }
});

module.exports = router;
