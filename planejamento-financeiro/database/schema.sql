CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NULL,
  phone VARCHAR(30) NULL,
  initial VARCHAR(5) NOT NULL,
  initial_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  base_month CHAR(7) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suggestions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('open','reviewing','closed') NOT NULL DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_suggestions_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_suggestions_user_status (user_id, status),
  INDEX idx_suggestions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  name VARCHAR(120) NOT NULL,
  type ENUM('income','expense') NOT NULL,
  icon_key VARCHAR(80),
  color VARCHAR(20),
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_categories_user_type (user_id, type),
  INDEX idx_categories_type_active (type, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS budgets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  description VARCHAR(180) NOT NULL,
  kind ENUM('income','expense') NOT NULL,
  budget_type ENUM('fixed','variable') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  start_month CHAR(7),
  end_month CHAR(7),
  has_due_date BOOLEAN DEFAULT FALSE,
  due_day INT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX ix_budgets_user_kind (user_id, kind),
  INDEX ix_budgets_user_budget_type (user_id, budget_type),
  INDEX ix_budgets_user_months (user_id, start_month, end_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  budget_id CHAR(36) NULL,
  category_id CHAR(36) NOT NULL,
  kind ENUM('income','expense') NOT NULL,
  title VARCHAR(180) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_date DATE NOT NULL,
  status ENUM('paid','pending','canceled') DEFAULT 'paid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_transactions_budget FOREIGN KEY (budget_id) REFERENCES budgets(id),
  CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX ix_transactions_user_date (user_id, transaction_date),
  INDEX ix_transactions_user_kind (user_id, kind),
  INDEX ix_transactions_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
