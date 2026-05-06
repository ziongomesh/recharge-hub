-- Adiciona valor da recarga (o que efetivamente cai no celular do cliente)
ALTER TABLE planos ADD COLUMN face_value DECIMAL(10,2) NULL AFTER cost;
-- Inicializa com o cost (recarga 1:1 = padrão Poeki). Admin pode editar depois.
UPDATE planos SET face_value = cost WHERE face_value IS NULL;
