ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_categories_user'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_type_active ON categories(type, active);
