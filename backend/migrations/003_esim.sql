-- Módulo eSIM
-- Produtos eSIM (criados pelo admin)
CREATE TABLE IF NOT EXISTS esim_produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  operadora VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  observacao TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estoque de eSIMs (cada linha = 1 unidade com QR code)
CREATE TABLE IF NOT EXISTS esim_estoque (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  qr_image VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES esim_produtos(id) ON DELETE CASCADE
);

-- Histórico de vendas (registro permanente, sem QR)
CREATE TABLE IF NOT EXISTS esim_vendas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  produto_id INT,
  produto_name VARCHAR(150) NOT NULL,
  operadora VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES esim_produtos(id) ON DELETE SET NULL
);

CREATE INDEX idx_esim_estoque_produto ON esim_estoque(produto_id);
CREATE INDEX idx_esim_vendas_user ON esim_vendas(user_id);
