# PostgreSQL schema

Scripts oficiais para banco PostgreSQL do DinCon.

Ordem para banco novo:

```bash
psql "$DATABASE_URL" -f database/postgres/schema.sql
psql "$DATABASE_URL" -f database/postgres/seed_categories.sql
```

Opcional em desenvolvimento:

```bash
psql "$DATABASE_URL" -f database/postgres/seed_dev.sql
```

Em provedores gerenciados, use a URL do provedor:

```text
postgresql://USUARIO:SENHA@HOST:5432/planejamento_financeiro
```
