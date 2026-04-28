-- Adiciona campo de logo personalizada por produto eSIM
ALTER TABLE esim_produtos ADD COLUMN logo_image VARCHAR(255) NULL AFTER observacao;
