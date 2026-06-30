INSERT INTO users (id, name, email, phone, initial, initial_balance, base_month, active, email_verified, verification_status) VALUES
('00000000-0000-0000-0000-000000000001', 'Usuario Demo', 'demo@dincon.local', NULL, 'U', 0.00, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), TRUE, TRUE, 'approved')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  initial = EXCLUDED.initial,
  initial_balance = EXCLUDED.initial_balance,
  base_month = EXCLUDED.base_month,
  active = EXCLUDED.active,
  email_verified = EXCLUDED.email_verified,
  verification_status = EXCLUDED.verification_status,
  updated_at = CURRENT_TIMESTAMP;
