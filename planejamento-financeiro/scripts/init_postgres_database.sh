#!/usr/bin/env bash
set -Eeuo pipefail

HOST_NAME="${HOST_NAME:-127.0.0.1}"
PORT="${PORT:-5432}"
ADMIN_DATABASE="${ADMIN_DATABASE:-postgres}"
ADMIN_USER="${ADMIN_USER:-postgres}"
DATABASE="${DATABASE:-planejamento_financeiro}"
APP_USER="${APP_USER:-}"
APP_PASSWORD="${APP_PASSWORD:-}"
SEED_DEV="${SEED_DEV:-false}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Comando '$1' nao encontrado. Instale o PostgreSQL client para usar o psql." >&2
    exit 1
  fi
}

require_command psql

echo "Criando database '${DATABASE}' se ainda nao existir..."
psql -h "${HOST_NAME}" -p "${PORT}" -U "${ADMIN_USER}" -d "${ADMIN_DATABASE}" \
  -v "db_name=${DATABASE}" \
  -f "${PROJECT_ROOT}/database/postgres/create_database.sql"

if [[ -n "${APP_USER}" && -n "${APP_PASSWORD}" ]]; then
  echo "Criando/atualizando usuario da aplicacao '${APP_USER}'..."
  psql -h "${HOST_NAME}" -p "${PORT}" -U "${ADMIN_USER}" -d "${ADMIN_DATABASE}" \
    -v "app_user=${APP_USER}" \
    -v "app_password=${APP_PASSWORD}" \
    -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') THEN EXECUTE format('CREATE USER %I WITH PASSWORD %L', :'app_user', :'app_password'); ELSE EXECUTE format('ALTER USER %I WITH PASSWORD %L', :'app_user', :'app_password'); END IF; END \$\$;"

  psql -h "${HOST_NAME}" -p "${PORT}" -U "${ADMIN_USER}" -d "${ADMIN_DATABASE}" \
    -c "GRANT ALL PRIVILEGES ON DATABASE \"${DATABASE}\" TO \"${APP_USER}\";"
fi

echo "Aplicando schema..."
psql -h "${HOST_NAME}" -p "${PORT}" -U "${ADMIN_USER}" -d "${DATABASE}" \
  -f "${PROJECT_ROOT}/database/postgres/schema.sql"

echo "Aplicando categorias padrao..."
psql -h "${HOST_NAME}" -p "${PORT}" -U "${ADMIN_USER}" -d "${DATABASE}" \
  -f "${PROJECT_ROOT}/database/postgres/seed_categories.sql"

if [[ -n "${APP_USER}" && -n "${APP_PASSWORD}" ]]; then
  echo "Garantindo permissoes do usuario '${APP_USER}' nas tabelas..."
  psql -h "${HOST_NAME}" -p "${PORT}" -U "${ADMIN_USER}" -d "${DATABASE}" \
    -c "GRANT USAGE, CREATE ON SCHEMA public TO \"${APP_USER}\"; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO \"${APP_USER}\"; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO \"${APP_USER}\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO \"${APP_USER}\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO \"${APP_USER}\";"
fi

if [[ "${SEED_DEV}" == "true" ]]; then
  echo "Aplicando seed de desenvolvimento..."
  psql -h "${HOST_NAME}" -p "${PORT}" -U "${ADMIN_USER}" -d "${DATABASE}" \
    -f "${PROJECT_ROOT}/database/postgres/seed_dev.sql"
fi

echo "Validando tabelas..."
psql -h "${HOST_NAME}" -p "${PORT}" -U "${ADMIN_USER}" -d "${DATABASE}" -c "\dt"

echo "Banco PostgreSQL pronto."
echo "DATABASE_URL=postgresql+psycopg2://USUARIO:SENHA@${HOST_NAME}:${PORT}/${DATABASE}"
