ALTER TABLE transactions
  MODIFY category_id CHAR(36) NULL;

DROP USER IF EXISTS 'dincon_app'@'127.0.0.1';
DROP USER IF EXISTS 'dincon_app'@'localhost';

CREATE USER 'dincon_app'@'127.0.0.1'
  IDENTIFIED VIA mysql_native_password USING PASSWORD('dincon_app');
CREATE USER 'dincon_app'@'localhost'
  IDENTIFIED VIA mysql_native_password USING PASSWORD('dincon_app');

GRANT ALL PRIVILEGES ON planejamento_financeiro.* TO 'dincon_app'@'127.0.0.1';
GRANT ALL PRIVILEGES ON planejamento_financeiro.* TO 'dincon_app'@'localhost';

FLUSH PRIVILEGES;
