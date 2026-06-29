-- WhatsApp audio support.
-- Run with:
-- mysql -h 127.0.0.1 -P 3306 -u root -p planejamento_financeiro < database/whatsapp_audio.sql

SET @db_name = DATABASE();

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @db_name AND table_name = 'whatsapp_messages' AND column_name = 'media_content_type'),
  'SELECT 1',
  'ALTER TABLE whatsapp_messages ADD COLUMN media_content_type VARCHAR(120) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
