INSERT INTO categories (id, name, type, icon_key, color, active) VALUES
('11111111-1111-1111-1111-111111111111', 'Financiamento', 'expense', 'Landmark', '#9D8BFF', TRUE),
('11111111-1111-1111-1111-111111111112', 'Moradia', 'expense', 'Home', '#FF7A85', TRUE),
('11111111-1111-1111-1111-111111111113', 'Energia', 'expense', 'Zap', '#F4C25A', TRUE),
('11111111-1111-1111-1111-111111111114', 'Internet', 'expense', 'Wifi', '#5BC0EB', TRUE),
('11111111-1111-1111-1111-111111111115', 'Saude', 'expense', 'HeartPulse', '#FF8FB1', TRUE),
('11111111-1111-1111-1111-111111111116', 'Mercado', 'expense', 'ShoppingCart', '#34E0A1', TRUE),
('11111111-1111-1111-1111-111111111117', 'Transporte', 'expense', 'Bus', '#6FD3C9', TRUE),
('11111111-1111-1111-1111-111111111118', 'Educacao', 'expense', 'GraduationCap', '#B69CFF', TRUE),
('11111111-1111-1111-1111-111111111119', 'Lazer', 'expense', 'Coffee', '#FFA46B', TRUE),
('11111111-1111-1111-1111-111111111120', 'Outros', 'expense', 'CircleDollarSign', '#9AA3B2', TRUE),
('22222222-2222-2222-2222-222222222221', 'Salario', 'income', 'Banknote', '#34E0A1', TRUE),
('22222222-2222-2222-2222-222222222222', 'Renda extra', 'income', 'Sparkles', '#7CE7C0', TRUE),
('22222222-2222-2222-2222-222222222223', 'Investimentos', 'income', 'TrendingUp', '#5BC0EB', TRUE),
('22222222-2222-2222-2222-222222222224', 'Outros', 'income', 'CircleDollarSign', '#9AA3B2', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  icon_key = EXCLUDED.icon_key,
  color = EXCLUDED.color,
  active = EXCLUDED.active,
  updated_at = CURRENT_TIMESTAMP;
