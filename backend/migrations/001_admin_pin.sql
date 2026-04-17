-- Migration: adiciona PIN de admin (4 dígitos) protegido por bcrypt
-- Rode no MySQL:  mysql -u root -p cometasms < backend/migrations/001_admin_pin.sql
--
-- PIN padrão: 2705   (hash bcrypt cost=10, gerado e verificado)

USE cometasms;

-- 1) Coluna pin_hash em users (nullable; só admins precisam preencher)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255) DEFAULT NULL;

-- 2) Seed do PIN "2705" para TODOS os usuários com role='admin'
UPDATE users
SET pin_hash = '$2b$10$ALFo.0ELVxWpfbkXZ3O8feiZDEmMelYE0AKGWP/aIy857eacF.j.C'
WHERE role = 'admin';

-- 3) (Opcional) Promover um usuário a admin e já setar o PIN 2705:
-- UPDATE users
-- SET role = 'admin',
--     pin_hash = '$2b$10$ALFo.0ELVxWpfbkXZ3O8feiZDEmMelYE0AKGWP/aIy857eacF.j.C'
-- WHERE email = 'seu@email.com';

-- 4) Pra trocar o PIN de um admin depois:
--    a) Gere um novo hash:  node -e "console.log(require('bcryptjs').hashSync('NOVO_PIN',10))"
--    b) UPDATE users SET pin_hash = '<novo_hash>' WHERE id = <admin_id>;
