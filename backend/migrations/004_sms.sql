-- Módulo SMS (compatível hero-sms.com / SMS-Activate)

-- Cache de serviços vindos da API (getServicesList)
CREATE TABLE IF NOT EXISTS sms_services (
  code        VARCHAR(32) PRIMARY KEY,           -- ex: "vk", "go", "wa"
  name        VARCHAR(150) NOT NULL,             -- ex: "VK", "Google", "WhatsApp"
  icon_url    VARCHAR(500),                      -- url do ícone retornada pela api
  enabled     BOOLEAN DEFAULT TRUE,              -- admin pode desabilitar
  default_markup_percent DECIMAL(6,2) DEFAULT 30.00,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cache de países (getCountries) — id é o id da hero-sms (0=Russia, 73=Brasil, etc)
CREATE TABLE IF NOT EXISTS sms_countries (
  id          INT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  iso         VARCHAR(8),
  enabled     BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Preço por (serviço, país) cacheado de getPrices, com markup individual override opcional
CREATE TABLE IF NOT EXISTS sms_prices (
  service_code VARCHAR(32) NOT NULL,
  country_id   INT NOT NULL,
  cost         DECIMAL(10,4) NOT NULL DEFAULT 0,        -- preço da hero-sms (rublos -> convertido em BRL)
  count        INT DEFAULT 0,                            -- estoque reportado pela api
  markup_percent DECIMAL(6,2) DEFAULT NULL,              -- override do markup global do serviço
  enabled      BOOLEAN DEFAULT TRUE,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (service_code, country_id)
);

-- Ativações (compras de número)
CREATE TABLE IF NOT EXISTS sms_activations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  hero_id         VARCHAR(64) NOT NULL,           -- id retornado pela hero-sms
  service_code    VARCHAR(32) NOT NULL,
  service_name    VARCHAR(150) NOT NULL,
  country_id      INT NOT NULL,
  country_name    VARCHAR(150),
  phone           VARCHAR(32) NOT NULL,
  cost            DECIMAL(10,4) NOT NULL,         -- custo bruto api
  sale_price      DECIMAL(10,2) NOT NULL,         -- preço cobrado do user (com markup)
  status          ENUM('waiting','received','canceled','finished','expired','refunded') DEFAULT 'waiting',
  sms_code        VARCHAR(64),                    -- código extraído (quando vier)
  sms_text        TEXT,                           -- texto completo do SMS
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at     TIMESTAMP NULL,
  expires_at      TIMESTAMP NULL,
  refunded        BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_hero (hero_id),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);

-- Configurações globais (taxa de conversão rublo->BRL, etc)
CREATE TABLE IF NOT EXISTS sms_config (
  k VARCHAR(50) PRIMARY KEY,
  v VARCHAR(255)
);
INSERT IGNORE INTO sms_config (k, v) VALUES
  ('rub_to_brl', '0.06'),         -- taxa de conversão padrão (1 RUB ≈ 0.06 BRL)
  ('global_markup', '30');        -- markup global fallback (%)
