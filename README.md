# CometaSMS

Plataforma de recargas de celular (Claro, TIM, Vivo) com confirmação instantânea via PIX.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind
- **Backend**: Node.js + Express + MySQL (pasta `backend/`)
- **Pagamentos**: PIX via gateway próprio
- **Recargas**: integração com API de operadoras

## Rodar localmente

```bash
# 1. Backend
cd backend
cp .env.example .env   # edite com suas credenciais
npm install
npm start              # porta 4000 (ou definida em PORT)

# 2. Frontend (em outro terminal)
npm install
npm run dev            # http://localhost:8080
```

## Build de produção

O backend serve o frontend. Faça o build do React e suba o Node.js:

```bash
npm run build                # gera /dist
cd backend && pm2 start server.js --name cometasms
```

## Estrutura

- `src/` — frontend React
- `backend/` — API REST + WebSocket
- `backend/migrations/` — schema MySQL
- `backend/routes/` — endpoints da API
