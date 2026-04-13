// Logger centralizado com cores para o terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgRed: '\x1b[41m',
  bgMagenta: '\x1b[45m',
};

function timestamp() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function log(icon, color, category, message, details = '') {
  const ts = `${colors.white}[${timestamp()}]${colors.reset}`;
  const cat = `${color}${colors.bright}[${category}]${colors.reset}`;
  const det = details ? `\n   ${colors.white}${details}${colors.reset}` : '';
  console.log(`${ts} ${icon} ${cat} ${message}${det}`);
}

module.exports = {
  auth: {
    register(username, email, phone, cpf) {
      log('🆕', colors.green, 'REGISTRO', `Novo usuário: ${colors.bright}${username}${colors.reset}`,
        `📧 ${email} | 📱 ${phone} | 🪪 ${cpf}`);
    },
    login(email, userId) {
      log('🔑', colors.blue, 'LOGIN', `Usuário logou: ${colors.bright}${email}${colors.reset}`,
        `🆔 ID: ${userId}`);
    },
    loginFailed(email) {
      log('❌', colors.red, 'LOGIN FALHOU', `Tentativa falha: ${colors.bright}${email}${colors.reset}`);
    },
    me(userId, username) {
      log('👤', colors.cyan, 'AUTH', `Sessão verificada: ${colors.bright}${username}${colors.reset} (ID: ${userId})`);
    },
  },
  recarga: {
    detect(phone, userId) {
      log('📡', colors.magenta, 'DETECTAR OP', `Número consultado: ${colors.bright}${phone}${colors.reset}`,
        `🆔 Usuário: ${userId}`);
    },
    checkPhone(phone, carrier, userId) {
      log('📱', colors.yellow, 'CHECK PHONE', `Verificando: ${colors.bright}${phone}${colors.reset}`,
        `📶 Operadora: ${carrier || 'auto'} | 🆔 Usuário: ${userId}`);
    },
    created(userId, username, phone, operadora, amount) {
      log('⚡', colors.green, 'RECARGA', `Nova recarga criada!`,
        `👤 ${username} (${userId}) | 📱 ${phone} | 📶 ${operadora} | 💰 R$ ${amount}`);
    },
    insufficientBalance(userId, balance, cost) {
      log('💸', colors.red, 'SALDO INSUF', `Saldo insuficiente`,
        `🆔 Usuário: ${userId} | Saldo: R$ ${balance} | Custo: R$ ${cost}`);
    },
  },
  pagamento: {
    pixGenerated(userId, username, amount, txId) {
      log('💳', colors.blue, 'PIX GERADO', `PIX criado!`,
        `👤 ${username} (${userId}) | 💰 R$ ${amount} | 🔖 TX: ${txId}`);
    },
    statusCheck(txId, status) {
      log('🔍', colors.cyan, 'PIX STATUS', `Verificando pagamento`,
        `🔖 TX: ${txId} | Status: ${status}`);
    },
  },
  webhook: {
    vizzionReceived(event, identifier) {
      log('🔔', colors.bgGreen, 'WEBHOOK VIZZION', `Evento recebido: ${colors.bright}${event}${colors.reset}`,
        `🔖 Identifier: ${identifier}`);
    },
    vizzionConfirmed(userId, amount) {
      log('✅', colors.green, 'PIX CONFIRMADO', `Pagamento confirmado!`,
        `🆔 Usuário: ${userId} | 💰 R$ ${amount} creditado`);
    },
    poekiReceived(id, status) {
      log('🔔', colors.bgYellow, 'WEBHOOK POEKI', `Evento recebido: status=${colors.bright}${status}${colors.reset}`,
        `🔖 Poeki ID: ${id}`);
    },
    recargaCompleted(userId, phone, amount) {
      log('✅', colors.green, 'RECARGA FEITA', `Recarga concluída!`,
        `🆔 Usuário: ${userId} | 📱 ${phone} | 💰 R$ ${amount}`);
    },
    recargaRefunded(userId, cost, status) {
      log('🔄', colors.yellow, 'ESTORNO', `Recarga ${status} — saldo devolvido`,
        `🆔 Usuário: ${userId} | 💰 R$ ${cost}`);
    },
  },
};
