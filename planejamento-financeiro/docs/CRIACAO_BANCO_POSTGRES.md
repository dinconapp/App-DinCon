# Criacao do banco PostgreSQL

Use estes scripts para criar a base `planejamento_financeiro` e todas as tabelas do DinCon.

## Windows PowerShell

Com usuário administrador do PostgreSQL:

```powershell
.\scripts\init_postgres_database.ps1 `
  -HostName "HOST_DO_POSTGRES" `
  -Port 5432 `
  -AdminDatabase "postgres" `
  -AdminUser "postgres" `
  -Database "planejamento_financeiro"
```

Criando também o usuário da aplicação:

```powershell
.\scripts\init_postgres_database.ps1 `
  -HostName "HOST_DO_POSTGRES" `
  -Port 5432 `
  -AdminDatabase "postgres" `
  -AdminUser "postgres" `
  -Database "planejamento_financeiro" `
  -AppUser "dincon_app" `
  -AppPassword "SENHA_FORTE"
```

Com seed de desenvolvimento:

```powershell
.\scripts\init_postgres_database.ps1 -SeedDev
```

## Linux/macOS

```bash
chmod +x scripts/init_postgres_database.sh

HOST_NAME="HOST_DO_POSTGRES" \
PORT="5432" \
ADMIN_USER="postgres" \
DATABASE="planejamento_financeiro" \
APP_USER="dincon_app" \
APP_PASSWORD="SENHA_FORTE" \
./scripts/init_postgres_database.sh
```

Com seed de desenvolvimento:

```bash
SEED_DEV=true ./scripts/init_postgres_database.sh
```

## Arquivos aplicados

1. `database/postgres/create_database.sql`
2. `database/postgres/schema.sql`
3. `database/postgres/seed_categories.sql`
4. Opcional: `database/postgres/seed_dev.sql`

## Validacao

```bash
psql "$DATABASE_URL" -c "\dt"
```

Tabelas principais esperadas:

- `users`
- `categories`
- `budgets`
- `transactions`
- `email_verification_attempts`
- `whatsapp_accounts`
- `whatsapp_messages`
- `whatsapp_transaction_drafts`
- `savings_investments`
- `plans`
- `subscriptions`
- `payments`
- `payment_events`
