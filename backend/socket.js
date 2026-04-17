// Socket.io para chat de suporte. Servidor só roteia ciphertext.
// Eventos cliente→servidor: join_session, send_message, agent_take, agent_pubkey, close_session, typing
// Eventos servidor→cliente: session_state, peer_pubkey, new_message, typing, peer_left, queue_update
const jwt = require('jsonwebtoken');
const db = require('./db');

function attachSupportSocket(io) {
  // Auth handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('no token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.adminVerified = !!decoded.adminVerified;
      next();
    } catch (e) {
      next(new Error('invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const isStaff = (socket.userRole === 'admin' || socket.userRole === 'mod') && socket.adminVerified;

    if (isStaff) socket.join('staff_lobby');

    socket.on('join_session', async (sessionId, ack) => {
      try {
        const [[s]] = await db.query('SELECT * FROM support_sessions WHERE id = ?', [sessionId]);
        if (!s) return ack?.({ ok: false, error: 'session not found' });
        const isOwner = s.user_id === socket.userId;
        if (!isOwner && !isStaff) return ack?.({ ok: false, error: 'forbidden' });
        socket.join(`session:${s.id}`);
        ack?.({ ok: true, session: s });
        // Manda pubkey do peer se já existir
        if (isOwner && s.agent_pubkey) socket.emit('peer_pubkey', { pubkey: s.agent_pubkey, role: 'agent' });
        if (!isOwner && s.user_pubkey)  socket.emit('peer_pubkey', { pubkey: s.user_pubkey,  role: 'user'  });
      } catch (e) {
        ack?.({ ok: false, error: 'server error' });
      }
    });

    // Staff "pega" o atendimento
    socket.on('agent_take', async (sessionId, agentPubkey, ack) => {
      try {
        if (!isStaff) return ack?.({ ok: false, error: 'forbidden' });
        const [[s]] = await db.query('SELECT * FROM support_sessions WHERE id = ?', [sessionId]);
        if (!s) return ack?.({ ok: false, error: 'not found' });
        if (s.status === 'closed') return ack?.({ ok: false, error: 'closed' });
        if (s.agent_id && s.agent_id !== socket.userId) return ack?.({ ok: false, error: 'já atendido' });

        await db.query(
          "UPDATE support_sessions SET agent_id = ?, agent_pubkey = ?, status = 'active' WHERE id = ?",
          [socket.userId, agentPubkey, sessionId]
        );
        const [[agent]] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [socket.userId]);
        io.to(`session:${sessionId}`).emit('session_state', {
          status: 'active',
          agent: { id: agent.id, username: agent.username, role: agent.role },
        });
        // entrega pubkey do agente para o usuário
        io.to(`session:${sessionId}`).emit('peer_pubkey', { pubkey: agentPubkey, role: 'agent' });
        io.to('staff_lobby').emit('queue_update');
        ack?.({ ok: true });
      } catch (e) {
        console.error('agent_take', e);
        ack?.({ ok: false, error: 'server error' });
      }
    });

    // Mensagem cifrada (servidor não decifra)
    socket.on('send_message', async ({ sessionId, ciphertext, iv }, ack) => {
      try {
        const [[s]] = await db.query('SELECT * FROM support_sessions WHERE id = ?', [sessionId]);
        if (!s || s.status === 'closed') return ack?.({ ok: false, error: 'sessão fechada' });
        const isOwner = s.user_id === socket.userId;
        const isAgent = isStaff && (s.agent_id === socket.userId || !s.agent_id);
        if (!isOwner && !isAgent) return ack?.({ ok: false, error: 'forbidden' });
        if (!ciphertext || !iv) return ack?.({ ok: false, error: 'payload inválido' });

        const role = isOwner ? 'user' : 'agent';
        const [r] = await db.query(
          'INSERT INTO support_messages (session_id, sender_id, sender_role, ciphertext, iv) VALUES (?, ?, ?, ?, ?)',
          [s.id, socket.userId, role, ciphertext, iv]
        );
        const msg = { id: r.insertId, session_id: s.id, sender_role: role, ciphertext, iv, created_at: new Date().toISOString() };
        io.to(`session:${s.id}`).emit('new_message', msg);
        ack?.({ ok: true, id: r.insertId });
      } catch (e) {
        console.error('send_message', e);
        ack?.({ ok: false, error: 'server error' });
      }
    });

    socket.on('typing', ({ sessionId, isTyping }) => {
      socket.to(`session:${sessionId}`).emit('typing', { isTyping, role: isStaff ? 'agent' : 'user' });
    });

    socket.on('close_session', async (sessionId, ack) => {
      try {
        const [[s]] = await db.query('SELECT * FROM support_sessions WHERE id = ?', [sessionId]);
        if (!s) return ack?.({ ok: false });
        const allowed = s.user_id === socket.userId || isStaff;
        if (!allowed) return ack?.({ ok: false });
        await db.query("UPDATE support_sessions SET status = 'closed', closed_at = NOW() WHERE id = ?", [sessionId]);
        io.to(`session:${sessionId}`).emit('session_state', { status: 'closed' });
        io.to('staff_lobby').emit('queue_update');
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false });
      }
    });
  });
}

module.exports = { attachSupportSocket };
