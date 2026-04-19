-- Marca quais operadoras a chave Poeki autoriza.
-- Atualizado pelo POST /api/operadoras/sync com base em GET /operators da Poeki.
-- Apenas operadoras com poeki_allowed=1 podem ser ativadas pelo admin.
ALTER TABLE operadoras
  ADD COLUMN poeki_allowed TINYINT(1) NOT NULL DEFAULT 0 AFTER enabled;
