-- Twilio Verify authentication support.
-- Run with:
-- mysql -h 127.0.0.1 -P 3306 -u root -p planejamento_financeiro < database/email_verify_auth.sql

SET @db_name = DATABASE();

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'email'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN email VARCHAR(180) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'password_hash'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'phone'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'active'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT FALSE'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'email_verified'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'verification_status'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN verification_status ENUM(''not_started'',''pending'',''approved'',''failed'',''expired'',''canceled'') NOT NULL DEFAULT ''not_started'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'verification_started_at'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN verification_started_at DATETIME NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'verified_at'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN verified_at DATETIME NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'users' AND column_name = 'last_login_at'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE users
SET active = TRUE,
    email_verified = TRUE,
    verification_status = 'approved',
    verified_at = COALESCE(verified_at, created_at)
WHERE password_hash IS NULL
  AND email IS NOT NULL
  AND verification_status = 'not_started';

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = @db_name AND table_name = 'users' AND index_name = 'uk_users_email'),
  'SELECT 1',
  'CREATE UNIQUE INDEX uk_users_email ON users(email)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS email_verification_attempts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone_number VARCHAR(30) NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'twilio',
  provider_service_sid VARCHAR(120) NULL,
  provider_verification_sid VARCHAR(120) NULL,
  channel ENUM('email','whatsapp','sms') NOT NULL DEFAULT 'email',
  status ENUM('pending','approved','failed','expired','canceled') NOT NULL DEFAULT 'pending',
  error_code VARCHAR(80) NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_email_verify_user_status (user_id, status),
  INDEX idx_email_verify_email_status (email, status),
  CONSTRAINT fk_email_verify_user FOREIGN KEY (user_id) REFERENCES users(id)
);

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'email_verification_attempts' AND column_name = 'phone_number'),
  'SELECT 1',
  'ALTER TABLE email_verification_attempts ADD COLUMN phone_number VARCHAR(30) NULL AFTER email'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE email_verification_attempts
MODIFY COLUMN channel ENUM('email','whatsapp','sms') NOT NULL DEFAULT 'email';
