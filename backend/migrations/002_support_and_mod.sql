-- Migration 002: rank moderador, last_login_at, sessões de suporte E2E criptografado
-- Rode: mysql -u root -p cometasms < backend/migrations/002_support_and_mod.sql

USE cometasms;

-- 1) Adiciona rank 'mod' e coluna last_login_at em users
ALTER TABLE users
  MODIFY COLUMN role ENUM('user','mod','admin') DEFAULT 'user';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL DEFAULT NULL;

-- 2) Garante que mods tenham PIN padrão 2705 também (mesmo hash bcrypt do admin)
UPDATE users
SET pin_hash = '$2b$10$ALFo.0ELVxWpfbkXZ3O8feiZDEmMelYE0AKGWP/aIy857eacF.j.C'
WHERE role IN ('admin','mod') AND (pin_hash IS NULL OR pin_hash = '');

-- 3) Sessões de suporte (1 por chat aberto). Armazena chave pública do user (ECDH P-256 SPKI base64)
CREATE TABLE IF NOT EXISTS support_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  agent_id INT DEFAULT NULL,
  status ENUM('waiting','active','closed') DEFAULT 'waiting',
  user_pubkey TEXT DEFAULT NULL,
  agent_pubkey TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_user (user_id)
);

-- 4) Mensagens — só ciphertext + IV. Servidor NUNCA vê o texto claro.
--    sender_role: 'user' ou 'agent'
CREATE TABLE IF NOT EXISTS support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  sender_id INT NOT NULL,
  sender_role ENUM('user','agent') NOT NULL,
  ciphertext TEXT NOT NULL,
  iv VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES support_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_created (session_id, created_at)
);
