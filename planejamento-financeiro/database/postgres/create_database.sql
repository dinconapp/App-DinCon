\set ON_ERROR_STOP on

SELECT 'CREATE DATABASE ' || quote_ident(:'db_name')
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_database
  WHERE datname = :'db_name'
)\gexec
