CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NULL,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'not_started'
    CHECK (verification_status IN ('not_started','pending','approved','failed','expired','canceled')),
  verification_started_at TIMESTAMP NULL,
  verified_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  initial VARCHAR(5) NOT NULL,
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_month VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_users_email ON users(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS suggestions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suggestions_user_status ON suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at);

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL REFERENCES users(id),
  name VARCHAR(120) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income','expense')),
  icon_key VARCHAR(80) NULL,
  color VARCHAR(20) NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_type_active ON categories(type, active);

CREATE TABLE IF NOT EXISTS budgets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  category_id VARCHAR(36) NULL REFERENCES categories(id),
  description VARCHAR(180) NOT NULL,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('income','expense')),
  budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('fixed','variable')),
  amount NUMERIC(12,2) NOT NULL,
  start_month VARCHAR(7) NULL,
  end_month VARCHAR(7) NULL,
  has_due_date BOOLEAN DEFAULT FALSE,
  due_day INTEGER NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_budgets_user_kind ON budgets(user_id, kind);
CREATE INDEX IF NOT EXISTS ix_budgets_user_budget_type ON budgets(user_id, budget_type);
CREATE INDEX IF NOT EXISTS ix_budgets_user_months ON budgets(user_id, start_month, end_month);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  budget_id VARCHAR(36) NULL REFERENCES budgets(id),
  category_id VARCHAR(36) NULL REFERENCES categories(id),
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('income','expense')),
  title VARCHAR(180) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  transaction_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid','pending','canceled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS ix_transactions_user_kind ON transactions(user_id, kind);
CREATE INDEX IF NOT EXISTS ix_transactions_category ON transactions(category_id);

CREATE TABLE IF NOT EXISTS email_verification_attempts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  email VARCHAR(180) NOT NULL,
  phone_number VARCHAR(30) NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'twilio',
  provider_service_sid VARCHAR(120) NULL,
  provider_verification_sid VARCHAR(120) NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'email' CHECK (channel IN ('email','whatsapp','sms')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','failed','expired','canceled')),
  error_code VARCHAR(80) NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verify_user_status ON email_verification_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_verify_email_status ON email_verification_attempts(email, status);

CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  phone_number VARCHAR(30) NOT NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'twilio',
  provider_identity VARCHAR(120) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_whatsapp_accounts_phone_provider UNIQUE (phone_number, provider)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL REFERENCES users(id),
  whatsapp_account_id VARCHAR(36) NULL REFERENCES whatsapp_accounts(id),
  provider VARCHAR(30) NOT NULL DEFAULT 'twilio',
  provider_message_id VARCHAR(120) NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text','audio','image','unknown')),
  from_number VARCHAR(30) NOT NULL,
  to_number VARCHAR(30) NOT NULL,
  body TEXT NULL,
  media_url TEXT NULL,
  media_content_type VARCHAR(120) NULL,
  transcription TEXT NULL,
  raw_payload JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_created ON whatsapp_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_provider_message ON whatsapp_messages(provider_message_id);

CREATE TABLE IF NOT EXISTS whatsapp_transaction_drafts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  whatsapp_message_id VARCHAR(36) NOT NULL REFERENCES whatsapp_messages(id),
  status VARCHAR(40) NOT NULL DEFAULT 'pending_confirmation'
    CHECK (status IN ('pending_confirmation','confirmed','rejected','expired','needs_correction')),
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('income','expense')),
  title VARCHAR(180) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category_id VARCHAR(36) NULL REFERENCES categories(id),
  transaction_date DATE NOT NULL,
  confidence NUMERIC(5,2) NULL,
  ai_explanation TEXT NULL,
  original_text TEXT NULL,
  created_transaction_id VARCHAR(36) NULL REFERENCES transactions(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_drafts_user_status ON whatsapp_transaction_drafts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_drafts_message ON whatsapp_transaction_drafts(whatsapp_message_id);

CREATE TABLE IF NOT EXISTS savings_investments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  initial_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  monthly_contribution NUMERIC(12,2) NOT NULL DEFAULT 0,
  interest_type VARCHAR(20) NOT NULL DEFAULT 'compound' CHECK (interest_type IN ('simple','compound','none')),
  interest_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  interest_period VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (interest_period IN ('monthly','yearly')),
  start_month VARCHAR(7) NOT NULL,
  end_month VARCHAR(7) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_savings_user_active ON savings_investments(user_id, active);
CREATE INDEX IF NOT EXISTS idx_savings_user_start ON savings_investments(user_id, start_month);

CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
  billing_interval VARCHAR(30) NOT NULL DEFAULT 'month',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_code ON plans(code);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  plan_id VARCHAR(36) NOT NULL REFERENCES plans(id),
  status VARCHAR(40) NOT NULL DEFAULT 'inactive',
  provider VARCHAR(40) NOT NULL DEFAULT 'mercadopago',
  provider_subscription_id VARCHAR(180) NULL,
  current_period_start TIMESTAMP NULL,
  current_period_end TIMESTAMP NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id ON subscriptions(provider_subscription_id);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  plan_id VARCHAR(36) NULL REFERENCES plans(id),
  subscription_id VARCHAR(36) NULL REFERENCES subscriptions(id),
  provider VARCHAR(40) NOT NULL DEFAULT 'mercadopago',
  provider_payment_id VARCHAR(180) NULL,
  payment_method VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
  description TEXT NULL,
  qr_code TEXT NULL,
  qr_code_base64 TEXT NULL,
  checkout_url TEXT NULL,
  external_reference VARCHAR(180) NULL,
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sandbox BOOLEAN NOT NULL DEFAULT TRUE,
  paid_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_external_reference ON payments(external_reference);

CREATE TABLE IF NOT EXISTS payment_events (
  id VARCHAR(36) PRIMARY KEY,
  payment_id VARCHAR(36) NULL REFERENCES payments(id),
  provider VARCHAR(40) NOT NULL DEFAULT 'mercadopago',
  event_type VARCHAR(120) NOT NULL,
  provider_event_id VARCHAR(180) NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_payment_events_provider_event UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_provider_event_id ON payment_events(provider_event_id);
