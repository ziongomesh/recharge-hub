-- Migration: adiciona PIN de admin (4 dígitos) protegido por bcrypt
-- Rode esse arquivo no MySQL: mysql cometasms < backend/migrations/001_admin_pin.sql

USE cometasms;

-- 1) Coluna pin_hash em users (nullable; só admins precisam)
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255) DEFAULT NULL;

-- 2) Seed do PIN 2705 para TODOS os usuários com role='admin'
--    Hash bcrypt cost=10 do PIN "2705"
UPDATE users
SET pin_hash = '$2b$10$YhhiXzpHin149uZCe06Kcen8dHxCJL9SkABw9kt6hoF9PjMx7jzhG'
WHERE role = 'admin';

-- Pra trocar o PIN de um admin específico depois, gere um novo bcrypt e:
-- UPDATE users SET pin_hash = '<novo_hash>' WHERE id = <admin_id>;
