require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const { attachSupportSocket } = require('./socket');

const app = express();
const PORT = process.env.PORT || 4000;
const frontendDistPath = path.resolve(__dirname, '../dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/sms', require('./routes/sms'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/status', require('./routes/status'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }

    return res.sendFile(frontendIndexPath);
  });
} else {
  app.get('/', (req, res) => {
    res
      .status(200)
      .type('html')
      .send('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CometaSMS</title></head><body style="font-family:Arial,sans-serif;padding:24px"><h1>CometaSMS</h1><p>O frontend não foi publicado neste servidor ainda.</p><p>API ativa em <a href="/api/health">/api/health</a>.</p></body></html>');
  });
}

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
attachSupportSocket(io);

server.listen(PORT, () => {
  console.log(`🚀 CometaSMS Backend (HTTP+WebSocket) rodando na porta ${PORT}`);
});
