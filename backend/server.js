require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { attachSupportSocket } = require('./socket');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/operadoras', require('./routes/operadoras'));
app.use('/api/planos', require('./routes/planos'));
app.use('/api/recargas', require('./routes/recargas'));
app.use('/api/pagamentos', require('./routes/pagamentos'));
app.use('/api/noticias', require('./routes/noticias'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/support', require('./routes/support'));
app.use('/api/esim', require('./routes/esim'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
attachSupportSocket(io);

server.listen(PORT, () => {
  console.log(`🚀 CometaSMS Backend (HTTP+WebSocket) rodando na porta ${PORT}`);
});
