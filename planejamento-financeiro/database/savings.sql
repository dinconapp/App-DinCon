CREATE TABLE IF NOT EXISTS savings_investments (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT NULL,
    initial_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    monthly_contribution DECIMAL(12,2) NOT NULL DEFAULT 0,
    interest_type ENUM('simple','compound','none') NOT NULL DEFAULT 'compound',
    interest_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
    interest_period ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
    start_month CHAR(7) NOT NULL,
    end_month CHAR(7) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_savings_user_active (user_id, active),
    INDEX idx_savings_user_start (user_id, start_month),
    CONSTRAINT fk_savings_user FOREIGN KEY (user_id) REFERENCES users(id)
);
