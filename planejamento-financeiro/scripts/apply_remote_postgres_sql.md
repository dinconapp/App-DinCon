# Aplicar SQL em banco PostgreSQL gerenciado

Use este guia para preparar um banco externo PostgreSQL para o DinCon sem VPS.

## Ordem recomendada

1. `database/postgres/schema.sql`
2. `database/postgres/seed_categories.sql`
3. Opcional em desenvolvimento: `database/postgres/seed_dev.sql`

## Via terminal

Use a `DATABASE_URL` do provedor PostgreSQL:

```bash
psql "$DATABASE_URL" -f database/postgres/schema.sql
psql "$DATABASE_URL" -f database/postgres/seed_categories.sql
```

Opcional em desenvolvimento:

```bash
psql "$DATABASE_URL" -f database/postgres/seed_dev.sql
```

## Via DBeaver

1. Crie uma conexão PostgreSQL.
2. Abra cada arquivo SQL na ordem acima.
3. Execute no banco `planejamento_financeiro`.
4. Valide as tabelas.

## Tabelas esperadas

No `psql`:

```sql
\dt
```

Principais tabelas:

- `users`
- `categories`
- `budgets`
- `transactions`
- `whatsapp_accounts`
- `whatsapp_messages`
- `whatsapp_transaction_drafts`
- `savings_investments`
- `plans`
- `payments`
- `subscriptions`
- `payment_events`
