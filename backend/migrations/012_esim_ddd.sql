-- DDD por unidade de estoque eSIM
ALTER TABLE esim_estoque ADD COLUMN ddd VARCHAR(3) NULL;
CREATE INDEX idx_esim_estoque_ddd ON esim_estoque(produto_id, ddd);

-- Guarda DDD entregue na venda (informativo)
ALTER TABLE esim_vendas ADD COLUMN ddd VARCHAR(3) NULL;
