#!/usr/bin/env bash
set -Eeuo pipefail

# DinCon production deploy helper.
# Target: Linux VPS with Docker Compose, Nginx container, frontend, backend and PostgreSQL.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
NGINX_DIR="${PROJECT_DIR}/deploy/nginx"
CERTBOT_WWW="${PROJECT_DIR}/deploy/certbot/www"
CERTBOT_CONF="${PROJECT_DIR}/deploy/certbot/conf"
BACKUP_DIR="${PROJECT_DIR}/deploy/backups"

DOMAIN="${DOMAIN:-dincon.com.br}"
WWW_DOMAIN="${WWW_DOMAIN:-www.dincon.com.br}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@dincon.com.br}"
DB_NAME="${DB_NAME:-planejamento_financeiro}"

cd "${PROJECT_DIR}"

usage() {
  cat <<EOF
DinCon deploy script

Usage:
  ./deploy/deploy_dincon_prod.sh prepare
  ./deploy/deploy_dincon_prod.sh up-http
  ./deploy/deploy_dincon_prod.sh ssl
  ./deploy/deploy_dincon_prod.sh up
  ./deploy/deploy_dincon_prod.sh init-db
  ./deploy/deploy_dincon_prod.sh apply-sql database/file.sql
  ./deploy/deploy_dincon_prod.sh status
  ./deploy/deploy_dincon_prod.sh logs [backend|frontend|nginx|postgres]
  ./deploy/deploy_dincon_prod.sh backup-db
  ./deploy/deploy_dincon_prod.sh renew-ssl
  ./deploy/deploy_dincon_prod.sh down

Environment overrides:
  DOMAIN=dincon.com.br
  WWW_DOMAIN=www.dincon.com.br
  CERTBOT_EMAIL=admin@dincon.com.br

Recommended first deploy:
  1. ./deploy/deploy_dincon_prod.sh prepare
  2. Edit .env and backend/.env.production
  3. ./deploy/deploy_dincon_prod.sh up-http
  4. Point DNS to this server and validate http://${DOMAIN}/api/health
  5. ./deploy/deploy_dincon_prod.sh ssl
  6. ./deploy/deploy_dincon_prod.sh init-db
  7. Validate https://${DOMAIN}/api/health
EOF
}

compose() {
  docker compose -f "${COMPOSE_FILE}" "$@"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

load_compose_env() {
  if [[ -f "${PROJECT_DIR}/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${PROJECT_DIR}/.env"
    set +a
  fi
  DB_NAME="${DB_NAME:-planejamento_financeiro}"
}

require_db_password() {
  load_compose_env
  if [[ -z "${DB_PASSWORD:-}" ]]; then
    echo "DB_PASSWORD is missing. Set it in ${PROJECT_DIR}/.env" >&2
    exit 1
  fi
  DB_USER="${DB_USER:-dincon_app}"
}

prepare() {
  require_command docker
  mkdir -p "${CERTBOT_WWW}" "${CERTBOT_CONF}" "${BACKUP_DIR}"

  if [[ ! -f "${PROJECT_DIR}/.env" ]]; then
    cp "${PROJECT_DIR}/.env.compose.example" "${PROJECT_DIR}/.env"
    echo "Created .env from .env.compose.example"
  fi

  if [[ ! -f "${PROJECT_DIR}/backend/.env.production" ]]; then
    cp "${PROJECT_DIR}/backend/.env.production.example" "${PROJECT_DIR}/backend/.env.production"
    echo "Created backend/.env.production from backend/.env.production.example"
  fi

  if [[ ! -f "${PROJECT_DIR}/frontend/.env.production" ]]; then
    cp "${PROJECT_DIR}/frontend/.env.production.example" "${PROJECT_DIR}/frontend/.env.production"
    echo "Created frontend/.env.production from frontend/.env.production.example"
  fi

  echo
  echo "Preparation complete."
  echo "Edit these files before going live:"
  echo "  ${PROJECT_DIR}/.env"
  echo "  ${PROJECT_DIR}/backend/.env.production"
  echo "  ${PROJECT_DIR}/frontend/.env.production"
}

up_http() {
  require_command docker
  mkdir -p "${CERTBOT_WWW}" "${CERTBOT_CONF}"
  cp "${NGINX_DIR}/dincon-http-only.conf" "${NGINX_DIR}/dincon.conf"
  compose up -d --build
  echo "HTTP stack is running. Test: curl http://${DOMAIN}/api/health"
}

up() {
  require_command docker
  if [[ -f "${CERTBOT_CONF}/live/${DOMAIN}/fullchain.pem" ]]; then
    cp "${NGINX_DIR}/dincon-ssl.conf" "${NGINX_DIR}/dincon.conf"
  else
    echo "TLS certificate not found. Using HTTP-only Nginx config."
    cp "${NGINX_DIR}/dincon-http-only.conf" "${NGINX_DIR}/dincon.conf"
  fi
  compose up -d --build
  compose ps
}

issue_ssl() {
  require_command docker
  mkdir -p "${CERTBOT_WWW}" "${CERTBOT_CONF}"

  docker run --rm \
    -v "${CERTBOT_WWW}:/var/www/certbot" \
    -v "${CERTBOT_CONF}:/etc/letsencrypt" \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "${CERTBOT_EMAIL}" \
    --agree-tos \
    --no-eff-email \
    -d "${DOMAIN}" \
    -d "${WWW_DOMAIN}"

  cp "${NGINX_DIR}/dincon-ssl.conf" "${NGINX_DIR}/dincon.conf"
  compose restart nginx
  echo "TLS enabled. Test: curl https://${DOMAIN}/api/health"
}

renew_ssl() {
  require_command docker
  docker run --rm \
    -v "${CERTBOT_WWW}:/var/www/certbot" \
    -v "${CERTBOT_CONF}:/etc/letsencrypt" \
    certbot/certbot renew --webroot --webroot-path=/var/www/certbot
  compose restart nginx
}

wait_for_db() {
  require_db_password
  echo "Waiting for PostgreSQL..."
  for _ in $(seq 1 60); do
    if compose exec -T postgres pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
      echo "PostgreSQL is ready."
      return 0
    fi
    sleep 2
  done
  echo "PostgreSQL did not become ready in time." >&2
  exit 1
}

run_sql_file() {
  local sql_file="$1"
  require_db_password

  if [[ ! -f "${sql_file}" ]]; then
    echo "SQL file not found: ${sql_file}" >&2
    exit 1
  fi

  echo "Applying ${sql_file}"
  compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" < "${sql_file}"
}

init_db() {
  wait_for_db

  local files=(
    "database/postgres/schema.sql"
    "database/postgres/seed_categories.sql"
  )

  echo "This command initializes/applies SQL files to database '${DB_NAME}'."
  echo "If this is not a fresh database, prefer apply-sql for only the missing migration."
  echo

  for file in "${files[@]}"; do
    run_sql_file "${PROJECT_DIR}/${file}"
  done

  echo "Database initialization finished."
}

backup_db() {
  require_db_password
  mkdir -p "${BACKUP_DIR}"
  local timestamp
  timestamp="$(date +%Y%m%d_%H%M%S)"
  local output="${BACKUP_DIR}/dincon_${DB_NAME}_${timestamp}.sql"

  compose exec -T postgres pg_dump -U "${DB_USER}" "${DB_NAME}" > "${output}"
  gzip -f "${output}"
  echo "Backup created: ${output}.gz"
}

case "${1:-}" in
  prepare)
    prepare
    ;;
  up-http)
    up_http
    ;;
  ssl)
    issue_ssl
    ;;
  renew-ssl)
    renew_ssl
    ;;
  up)
    up
    ;;
  init-db)
    init_db
    ;;
  apply-sql)
    if [[ -z "${2:-}" ]]; then
      echo "Missing SQL file path." >&2
      usage
      exit 1
    fi
    wait_for_db
    run_sql_file "${PROJECT_DIR}/${2}"
    ;;
  status)
    compose ps
    ;;
  logs)
    if [[ -n "${2:-}" ]]; then
      compose logs -f "$2"
    else
      compose logs -f
    fi
    ;;
  backup-db)
    backup_db
    ;;
  down)
    compose down
    ;;
  ""|help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $1" >&2
    usage
    exit 1
    ;;
esac
