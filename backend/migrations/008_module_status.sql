-- Status de manutenção por módulo (recargas, sms, esim)
CREATE TABLE IF NOT EXISTS module_status (
  module VARCHAR(32) PRIMARY KEY,
  maintenance TINYINT(1) NOT NULL DEFAULT 0,
  message VARCHAR(255) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO module_status (module, maintenance) VALUES
  ('recargas', 0),
  ('sms', 0),
  ('esim', 0);
