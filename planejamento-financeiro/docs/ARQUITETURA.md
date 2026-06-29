# Arquitetura - DinCon

## Visão geral

DinCon é um sistema financeiro pessoal com:

- Frontend Next.js/TypeScript.
- Backend FastAPI/Python.
- Banco MariaDB.
- Integração Twilio WhatsApp e Twilio Verify SMS.
- Integração OpenAI para interpretação/transcrição.
- Integração Mercado Pago para billing.

## Frontend

Diretórios principais:

- `frontend/src/app`: rotas Next.js.
- `frontend/src/components`: componentes visuais.
- `frontend/src/hooks`: estado e carregamento por domínio.
- `frontend/src/services`: cliente HTTP e serviços por domínio.
- `frontend/src/types`: contratos TypeScript.
- `frontend/src/styles`: CSS global e tema `cf-*`.

Rotas principais:

- `/dashboard`
- `/planejamento` exibida como Fluxo de Caixa.
- `/transacoes` exibida como Lançamentos.
- `/contas`
- `/cofrinho`
- `/perfil`
- `/login`
- `/cadastro`
- `/esqueci-senha`
- `/planos`
- `/checkout`
- `/minha-assinatura`

## Backend

Camadas:

- `domain`: entidades, serviços e contratos de domínio.
- `application`: schemas e casos de uso.
- `infrastructure`: banco, provedores externos e integrações.
- `interfaces/api`: rotas FastAPI.

Rotas principais:

- `/api/auth/*`
- `/api/users/*`
- `/api/categories`
- `/api/budgets`
- `/api/transactions`
- `/api/bills`
- `/api/dashboard`
- `/api/savings`
- `/api/billing`
- `/api/integrations/whatsapp`

## Banco

Scripts SQL em `database/`:

- `schema.sql`: tabelas financeiras base.
- `seed_categories.sql`: categorias iniciais.
- `whatsapp_integration.sql`: tabelas WhatsApp.
- `whatsapp_audio.sql`: suporte incremental a áudio.
- `savings.sql`: Cofrinho/investimentos.
- `billing_mercado_pago.sql`: planos, pagamentos e assinaturas.
- `email_verify_auth.sql`: autenticação/verificação SMS.

## Conceitos de produto

- Receita prevista: item recorrente esperado no fluxo mensal.
- Conta fixa: gasto recorrente com vencimento.
- Lançamento: movimentação real do mês.
- Conta do mês: derivada de conta fixa + status de pagamento.
- Cofrinho: investimentos e projeção, separado do fluxo mensal.
- WhatsApp: canal de criação de rascunhos de lançamento.

## Deploy

Produção usa:

- Nginx na borda.
- Frontend Next standalone.
- Backend Uvicorn.
- MariaDB.

Arquivo principal:

- `docker-compose.prod.yml`

Documentação:

- `docs/DEPLOY_PRODUCAO.md`
- `docs/OPERACAO.md`
