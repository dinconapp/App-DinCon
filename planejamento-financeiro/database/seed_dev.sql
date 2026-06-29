INSERT INTO users (id, name, email, phone, initial, initial_balance, base_month) VALUES
('00000000-0000-0000-0000-000000000001', 'Usuario Demo', 'demo@dincon.local', NULL, 'U', 0.00, DATE_FORMAT(CURDATE(), '%Y-%m'))
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone), initial = VALUES(initial), initial_balance = VALUES(initial_balance), base_month = VALUES(base_month);
