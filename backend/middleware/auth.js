const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Token não fornecido' });

  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.adminVerified = !!decoded.adminVerified;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.userRole !== 'admin') return res.status(403).json({ message: 'Acesso negado' });
  if (!req.adminVerified) return res.status(403).json({ message: 'PIN admin não verificado' });
  next();
}

// Permite admin OU mod (ambos precisam ter passado pelo PIN)
function staffMiddleware(req, res, next) {
  if (req.userRole !== 'admin' && req.userRole !== 'mod') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  if (!req.adminVerified) return res.status(403).json({ message: 'PIN não verificado' });
  next();
}

module.exports = { authMiddleware, adminMiddleware, staffMiddleware };
