-- Mantém apenas Brasil (id=73) ativo na lista de países SMS.
-- Demais países ficam desabilitados (não aparecem para o usuário).
UPDATE sms_countries SET enabled = FALSE WHERE id <> 73;
UPDATE sms_countries SET enabled = TRUE  WHERE id = 73;
