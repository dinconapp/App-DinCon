# Aplicar SQL em banco MariaDB/MySQL gerenciado

Use este guia para preparar um banco externo para o DinCon sem VPS.

## Ordem recomendada

1. `database/schema.sql`
2. `database/seed_categories.sql`
3. `database/migration_income_category_optional.sql`
4. `database/user_contact_fields.sql`
5. `database/whatsapp_integration.sql`
6. `database/whatsapp_audio.sql`
7. `database/savings.sql`
8. `database/billing_mercado_pago.sql`
9. `database/email_verify_auth.sql`

## Via terminal

Substitua `HOST_DO_BANCO`, `USUARIO` e o nome do banco conforme o provedor:

```bash
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/schema.sql
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/seed_categories.sql
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/migration_income_category_optional.sql
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/user_contact_fields.sql
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/whatsapp_integration.sql
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/whatsapp_audio.sql
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/savings.sql
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/billing_mercado_pago.sql
mysql -h HOST_DO_BANCO -P 3306 -u USUARIO -p planejamento_financeiro < database/email_verify_auth.sql
```

## Via DBeaver

1. Crie uma conexão MySQL/MariaDB.
2. Abra cada arquivo SQL na ordem acima.
3. Execute no banco `planejamento_financeiro`.
4. Valide com `SHOW TABLES;`.

## Tabelas esperadas

```sql
SHOW TABLES;
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
- `billing_plans`
- `billing_payments`
- `billing_subscriptions`

Se o banco já existir, aplique apenas scripts ainda não executados. Alguns scripts são incrementais e podem falhar se a coluna ou tabela já existir.
