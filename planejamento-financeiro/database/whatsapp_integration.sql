CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'twilio',
  provider_identity VARCHAR(120) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uk_whatsapp_accounts_phone_provider UNIQUE (phone_number, provider),
  CONSTRAINT fk_whatsapp_accounts_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  whatsapp_account_id CHAR(36) NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'twilio',
  provider_message_id VARCHAR(120) NULL,
  direction ENUM('inbound','outbound') NOT NULL,
  message_type ENUM('text','audio','image','unknown') NOT NULL,
  from_number VARCHAR(30) NOT NULL,
  to_number VARCHAR(30) NOT NULL,
  body TEXT NULL,
  media_url TEXT NULL,
  media_content_type VARCHAR(120) NULL,
  transcription TEXT NULL,
  raw_payload JSON NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_whatsapp_messages_user_created (user_id, created_at),
  INDEX idx_whatsapp_messages_provider_message (provider_message_id),
  CONSTRAINT fk_whatsapp_messages_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_whatsapp_messages_account FOREIGN KEY (whatsapp_account_id) REFERENCES whatsapp_accounts(id)
);

CREATE TABLE IF NOT EXISTS whatsapp_transaction_drafts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  whatsapp_message_id CHAR(36) NOT NULL,
  status ENUM('pending_confirmation','confirmed','rejected','expired','needs_correction') NOT NULL DEFAULT 'pending_confirmation',
  kind ENUM('income','expense') NOT NULL,
  title VARCHAR(180) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category_id CHAR(36) NULL,
  transaction_date DATE NOT NULL,
  confidence DECIMAL(5,2) NULL,
  ai_explanation TEXT NULL,
  original_text TEXT NULL,
  created_transaction_id CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_whatsapp_drafts_user_status (user_id, status),
  INDEX idx_whatsapp_drafts_message (whatsapp_message_id),
  CONSTRAINT fk_whatsapp_drafts_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_whatsapp_drafts_message FOREIGN KEY (whatsapp_message_id) REFERENCES whatsapp_messages(id),
  CONSTRAINT fk_whatsapp_drafts_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_whatsapp_drafts_transaction FOREIGN KEY (created_transaction_id) REFERENCES transactions(id)
);
