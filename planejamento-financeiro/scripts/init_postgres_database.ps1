param(
  [string]$HostName = "127.0.0.1",
  [int]$Port = 5432,
  [string]$AdminDatabase = "postgres",
  [string]$AdminUser = "postgres",
  [string]$Database = "planejamento_financeiro",
  [string]$AppUser = "",
  [string]$AppPassword = "",
  [switch]$SeedDev
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Comando '$Name' nao encontrado. Instale o PostgreSQL client para usar o psql."
  }
}

Require-Command "psql"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$CreateDatabaseSql = Join-Path $ProjectRoot "database/postgres/create_database.sql"
$SchemaSql = Join-Path $ProjectRoot "database/postgres/schema.sql"
$SeedCategoriesSql = Join-Path $ProjectRoot "database/postgres/seed_categories.sql"
$SeedDevSql = Join-Path $ProjectRoot "database/postgres/seed_dev.sql"

Write-Host "Criando database '$Database' se ainda nao existir..."
psql -h $HostName -p $Port -U $AdminUser -d $AdminDatabase -v "db_name=$Database" -f $CreateDatabaseSql

if ($AppUser -and $AppPassword) {
  Write-Host "Criando/atualizando usuario da aplicacao '$AppUser'..."
  psql -h $HostName -p $Port -U $AdminUser -d $AdminDatabase -v "app_user=$AppUser" -v "app_password=$AppPassword" -v "db_name=$Database" -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') THEN EXECUTE format('CREATE USER %I WITH PASSWORD %L', :'app_user', :'app_password'); ELSE EXECUTE format('ALTER USER %I WITH PASSWORD %L', :'app_user', :'app_password'); END IF; END `$`$;"
  psql -h $HostName -p $Port -U $AdminUser -d $AdminDatabase -v "app_user=$AppUser" -v "db_name=$Database" -c "GRANT ALL PRIVILEGES ON DATABASE `"$Database`" TO `"$AppUser`";"
}

Write-Host "Aplicando schema..."
psql -h $HostName -p $Port -U $AdminUser -d $Database -f $SchemaSql

Write-Host "Aplicando categorias padrao..."
psql -h $HostName -p $Port -U $AdminUser -d $Database -f $SeedCategoriesSql

if ($AppUser -and $AppPassword) {
  Write-Host "Garantindo permissoes do usuario '$AppUser' nas tabelas..."
  psql -h $HostName -p $Port -U $AdminUser -d $Database -c "GRANT USAGE, CREATE ON SCHEMA public TO `"$AppUser`"; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO `"$AppUser`"; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO `"$AppUser`"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO `"$AppUser`"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO `"$AppUser`";"
}

if ($SeedDev) {
  Write-Host "Aplicando seed de desenvolvimento..."
  psql -h $HostName -p $Port -U $AdminUser -d $Database -f $SeedDevSql
}

Write-Host "Validando tabelas..."
psql -h $HostName -p $Port -U $AdminUser -d $Database -c "\dt"

Write-Host "Banco PostgreSQL pronto."
Write-Host "DATABASE_URL=postgresql+psycopg2://USUARIO:SENHA@$HostName`:$Port/$Database"
