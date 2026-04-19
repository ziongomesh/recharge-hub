-- Permite admin definir preço de venda fixo (em BRL) por (serviço, país).
-- Quando preenchido, sobrescreve o cálculo automático (cost * rub_to_brl * markup).
ALTER TABLE sms_prices
  ADD COLUMN sale_price_brl DECIMAL(10,2) DEFAULT NULL AFTER markup_percent;
