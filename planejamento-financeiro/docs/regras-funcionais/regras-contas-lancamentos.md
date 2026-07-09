# Regras Funcionais - Contas, Budgets e Lancamentos

## 1. Visao geral

O sistema organiza o fluxo financeiro em torno de quatro conceitos principais:

- `budgets`: previsoes cadastradas pelo usuario. Representam contas fixas, receitas previstas e tambem itens pontuais classificados por `budget_type`.
- `transactions`: movimentos realizados. Representam o que foi efetivamente lancado no mes, com status `paid`, `pending` ou `canceled`.
- `categories`: classificacao de apoio para agrupar budgets e transactions por tipo `income` ou `expense`.
- `kind`: tipo financeiro basico, sempre `income` ou `expense`.
- `budget_type`: recorrencia do budget, sempre `fixed` ou `variable`.

Na pratica:

- `kind` define se o item e entrada ou saida.
- `budget_type` define se o item previsto e fixo ou variÃ¡vel.
- `transactions.budget_id` liga um lancamento a um budget.
- `transactions.status` define se o lancamento foi realizado, ficou pendente ou foi cancelado.

Os dados principais do frontend vem de:

- `budgets`
- `transactions`
- `bills`  que e uma visao derivada de `budgets` + `transactions`
- `dashboard`  que e uma agregacao calculada no backend

## 2. Glossario funcional

| Termo | Significado funcional | Fonte tecnica |
|---|---|---|
| Conta fixa | Budget de saida recorrente. Na interface do fluxo de caixa aparece como compromisso recorrente. | `budgets.kind = expense` e `budgets.budget_type = fixed` em `backend/app/infrastructure/db/models.py` e `backend/app/application/budgets/schemas.py` |
| Conta variÃ¡vel | Budget de saida nao recorrente. No dashboard aparece como gasto variÃ¡vel quando existe budget cadastrado. | `budgets.kind = expense` e `budgets.budget_type = variable` |
| Receita prevista | Budget de entrada previsto. Aparece na tela de fluxo de caixa e no dashboard como ganho previsto. | `budgets.kind = income` |
| LanÃ§amento avulso | Transaction realizada sem budget fixo associado. No backend e tratada como transaction sem `budget_id` ou com relacao ausente. No frontend do fluxo de caixa a regra e mais ampla e pode incluir transaction ligada a budget variÃ¡vel. | Backend: `transaction.budget_id IS NULL` ou budget ausente em `backend/app/domain/dashboard/services.py`. Frontend: `isLooseTransaction()` em `frontend/src/utils/financial-classification.ts` |
| Entrada | Movimento financeiro de entrada. | `transactions.kind = income` |
| Saida | Movimento financeiro de saida. | `transactions.kind = expense` |
| Realizado | Transaction com `status = paid`. | `transactions.status = paid` |
| Pendente | Transaction com `status = pending`. | `transactions.status = pending` |
| Cancelado | Transaction com `status = canceled`. | `transactions.status = canceled` |
| Conta paga | Budget de saida fixa com vencimento e transaction paga vinculada ao budget. | `bills` + `transactions` |

### 2.1 Glossario de enums e traducoes PT-BR

Esta camada e importante porque o backend trabalha com valores tecnicos em ingles, enquanto o frontend converte parte deles para rotulos em portugues. Nem todos os enums sao traduzidos no mesmo lugar.

#### Financeiro

| Enum tecnico | Valores | Rotulo/uso em PT-BR | Fonte tecnica |
|---|---|---|---|
| `kind` | `income`, `expense` | `Entrada`, `Gasto`, `Receita prevista`, `Conta fixa` dependendo da tela | `backend/app/infrastructure/db/models.py`, `backend/app/application/*/schemas.py`, `frontend/src/components/planejamento/BudgetFormModal.tsx`, `frontend/src/components/transacoes/TransactionFormModal.tsx` |
| `budget_type` | `fixed`, `variable` | `Fixa`, `VariÃ¡vel`, `Fixo`, `VariÃ¡vel` | `backend/app/infrastructure/db/models.py`, `frontend/src/components/planejamento/BudgetFormModal.tsx`, `frontend/src/components/planejamento/BudgetRow.tsx`, `frontend/src/components/planejamento/PlanningSummaryCards.tsx` |
| `transactions.status` | `paid`, `pending`, `canceled` | `Pago`, `Pendente`, `Cancelado`, `Recebido` para entrada paga | `backend/app/infrastructure/db/models.py`, `frontend/src/components/ui/StatusBadge.tsx`, `frontend/src/components/transacoes/TransactionRow.tsx`, `frontend/src/components/planejamento/PlanningSummaryCards.tsx` |

#### Cobranca e assinatura

| Enum tecnico | Valores | Rotulo/uso em PT-BR | Fonte tecnica |
|---|---|---|---|
| `payment_method` | `pix`, `card` | `Pix`, `Cartao` | `backend/app/application/billing/use_cases.py`, `frontend/src/components/billing/billingFormat.ts` |
| `payment.status` | `pending`, `processing`, `in_process`, `approved`, `paid`, `failed`, `rejected`, `canceled`, `cancelled`, `expired`, `refunded`, `charged_back`, `active`, `inactive` | `Pendente`, `Em analise`, `Aprovado`, `Falhou`, `Recusado`, `Cancelado`, `Expirado`, `Reembolsado`, `Contestacao`, `Ativa`, `Inativa` | `backend/app/domain/billing/services.py`, `frontend/src/components/billing/billingFormat.ts` |
| `payment.status_detail` | `pending_review_manual`, `cc_rejected_*`, `expired` | Mensagens de detalhe como analise manual, cartao recusado ou Pix expirado | `backend/app/application/billing/use_cases.py`, `frontend/src/components/billing/billingFormat.ts` |
| `subscription.status` | `active`, `inactive`, outros estados do gateway | `Ativa`, `Inativa` e equivalentes de ciclo de assinatura | `backend/app/infrastructure/db/models.py`, `frontend/src/components/billing/billingFormat.ts` |

#### WhatsApp

| Enum tecnico | Valores | Rotulo/uso em PT-BR | Fonte tecnica |
|---|---|---|---|
| `whatsapp_accounts.provider` | `twilio` | `Twilio` | `backend/app/application/whatsapp/schemas.py`, `backend/app/application/whatsapp/use_cases.py` |
| `whatsapp_messages.direction` | `inbound`, `outbound` | `Entrada`, `Saida` por contexto de integracao | `backend/app/infrastructure/db/models.py` |
| `whatsapp_messages.message_type` | `text`, `audio`, `image`, `unknown` | `Texto`, `Audio`, `Imagem`, `Desconhecido` por contexto | `backend/app/infrastructure/db/models.py`, `backend/app/infrastructure/whatsapp/providers/twilio_provider.py` |
| `whatsapp_transaction_drafts.status` | `pending_confirmation`, `confirmed`, `rejected`, `expired`, `needs_correction` | `Pendente de confirmacao`, `Confirmado`, `Rejeitado`, `Expirado`, `Precisa de correcao` | `backend/app/infrastructure/db/models.py`, `backend/app/application/whatsapp/schemas.py` |
| `verification_status` | `not_started`, `pending`, `approved`, `failed`, `expired`, `canceled` | `Nao iniciado`, `Pendente`, `Aprovado`, `Falhou`, `Expirado`, `Cancelado` | `backend/app/infrastructure/db/models.py` |
| `channel` | `email`, `whatsapp`, `sms` | `Email`, `WhatsApp`, `SMS` | `backend/app/infrastructure/db/models.py` |

Observacao:

- Em varios pontos o frontend nao traduz via tabela unica; ele usa funcoes utilitarias ou labels inline.
- Para analise funcional, o mais importante e entender que o enum tecnico quase sempre permanece em ingles no backend.

### 2.2 Glossario PT -> valor tecnico

#### Financeiro

| Rotulo PT | Valor tecnico | Tela/Painel | Onde aparece |
|---|---|---|---|
| Entrada | `income` | `LanÃ§amentos`, `Fluxo de Caixa`, `Dashboard` | `kind` em budgets e transactions |
| Gasto | `expense` | `LanÃ§amentos`, `Fluxo de Caixa`, `Dashboard` | `kind` em budgets e transactions |
| Receita prevista | `income` + budget | `Fluxo de Caixa`, `Dashboard` | budget de entrada |
| Conta fixa | `expense` + budget | `Fluxo de Caixa`, `Contas`, `Dashboard` | budget de saida fixa |
| Fixo | `fixed` | `Fluxo de Caixa`, `Contas`, `Dashboard` | `budget_type` |
| VariÃ¡vel | `variable` | `Fluxo de Caixa`, `Dashboard` | `budget_type` |
| Fixa | `fixed` | `Fluxo de Caixa` | rÃ³tulo do formulÃ¡rio de budget |
| Programada | `variable` | `Fluxo de Caixa` | rÃ³tulo do formulÃ¡rio de budget |
| Pago | `paid` | `LanÃ§amentos`, `Fluxo de Caixa`, `Contas`, `Dashboard` | `transactions.status` |
| Pendente | `pending` | `LanÃ§amentos`, `Fluxo de Caixa`, `Contas` | `transactions.status` |
| Cancelado | `canceled` | `LanÃ§amentos` | `transactions.status` |
| Recebido | `paid` em entrada | `LanÃ§amentos`, `Fluxo de Caixa`, `Dashboard` | rotulo visual no frontend |
| Atrasado | status visual derivado | `LanÃ§amentos`, `Fluxo de Caixa`, `Contas` | quando `pending` e data vencida |
| Manual | sem origem automatica | `LanÃ§amentos` | badge de origem |
| Conta fixa | `fixed_bill` | `LanÃ§amentos` | origem visual da transaction |
| Projetado | `projected` | `LanÃ§amentos` | origem visual da transaction |

#### Cobranca / assinatura

| Rotulo PT | Valor tecnico | Tela/Painel | Onde aparece |
|---|---|---|---|
| Pix | `pix` | `Checkout`, `Minha Assinatura` | `payment_method` |
| Cartao | `card` | `Checkout`, `Minha Assinatura` | `payment_method` |
| Aprovado | `approved` / `paid` / `active` | `Checkout`, `Minha Assinatura` | status de pagamento ou assinatura |
| Em analise | `processing` / `in_process` | `Checkout` | status de pagamento |
| Pendente | `pending` | `Checkout` | status de pagamento |
| Falhou | `failed` | `Checkout` | status de pagamento |
| Recusado | `rejected` | `Checkout` | status de pagamento |
| Cancelado | `canceled` / `cancelled` | `Checkout` | status de pagamento |
| Expirado | `expired` | `Checkout` | status de pagamento |
| Reembolsado | `refunded` | `Checkout` | status de pagamento |
| Contestacao | `charged_back` | `Checkout` | status de pagamento |
| Ativa | `active` | `Minha Assinatura` | status de assinatura |
| Inativa | `inactive` | `Minha Assinatura` | status de assinatura |
| WhatsApp liberado | `pro` | `Minha Assinatura`, `Perfil` | plano/codigo de assinatura |

#### WhatsApp

| Rotulo PT | Valor tecnico | Tela/Painel | Onde aparece |
|---|---|---|---|
| Entrada | `inbound` | `Perfil` | mensagem WhatsApp |
| Saida | `outbound` | `Perfil` | mensagem WhatsApp |
| Texto | `text` | `Perfil` | `message_type` |
| Audio | `audio` | `Perfil` | `message_type` |
| Imagem | `image` | `Perfil` | `message_type` |
| Desconhecido | `unknown` | `Perfil` | `message_type` |
| Pendente de confirmacao | `pending_confirmation` | `Perfil` | rascunho WhatsApp |
| Confirmado | `confirmed` | `Perfil` | rascunho WhatsApp |
| Rejeitado | `rejected` | `Perfil` | rascunho WhatsApp |
| Expirado | `expired` | `Perfil` | rascunho WhatsApp |
| Precisa de correcao | `needs_correction` | `Perfil` | rascunho WhatsApp |
| Nao iniciado | `not_started` | `Perfil` | verificacao de usuario |
| Pendente | `pending` | `Perfil` | verificacao de usuario |
| Aprovado | `approved` | `Perfil` | verificacao de usuario |
| Falhou | `failed` | `Perfil` | verificacao de usuario |
| Email | `email` | `Perfil` | canal de verificacao |
| WhatsApp | `whatsapp` | `Perfil` | canal de verificacao |
| SMS | `sms` | `Perfil` | canal de verificacao |

## 3. Modelo de dados

### budgets

Arquivo principal:

- `backend/app/infrastructure/db/models.py`
- `backend/app/application/budgets/schemas.py`
- `database/postgres/schema.sql`

Campos relevantes:

| Campo | Tipo funcional | Observacao |
|---|---|---|
| `id` | Identificador do budget | PK |
| `user_id` | Dono do budget | Obrigatorio |
| `category_id` | Categoria associada | No ORM e no schema Postgres e nullable, mas o backend exige valor na criacao/edicao |
| `description` | Nome do item previsto | Ex.: aluguel, salario |
| `kind` | Entrada ou saida | `income` ou `expense` |
| `budget_type` | Recorrencia do budget | `fixed` ou `variable` |
| `amount` | Valor previsto | Decimal > 0 |
| `start_month` | Mes inicial de vigencia | Opcional |
| `end_month` | Mes final de vigencia | Opcional |
| `has_due_date` | Indica se ha vencimento | Usado principalmente em despesas fixas e receitas com data prevista |
| `due_day` | Dia do vencimento/recebimento | Obrigatorio quando `has_due_date = true` no schema Pydantic |
| `active` | Budget ativo ou inativo | `list_by_user` retorna apenas ativos |
| `created_at` | Criacao | Timestamp |
| `updated_at` | Atualizacao | Timestamp |

Regras associadas:

- `BudgetUseCases.create()` e `update()` validam se a categoria possui o mesmo `type` do `kind`.
- Se `budget_type = fixed`, o backend forÃ§a `end_month = None`.
- `list_by_user()` traz apenas budgets com `active = true`.

### transactions

Arquivo principal:

- `backend/app/infrastructure/db/models.py`
- `backend/app/application/transactions/schemas.py`
- `backend/app/application/transactions/use_cases.py`
- `database/postgres/schema.sql`

Campos relevantes:

| Campo | Tipo funcional | Observacao |
|---|---|---|
| `id` | Identificador do lancamento | PK |
| `user_id` | Dono do lancamento | Obrigatorio |
| `budget_id` | Vinculo com budget | Opcional |
| `category_id` | Categoria do lancamento | Opcional no schema e no backend; obrigatorio para `expense` |
| `kind` | Entrada ou saida | `income` ou `expense` |
| `title` | Descricao do lancamento | Obrigatorio |
| `amount` | Valor realizado | Decimal > 0 |
| `transaction_date` | Data do lancamento | Usada para filtro mensal |
| `status` | Situacao do lancamento | `paid`, `pending`, `canceled` |
| `source` | Origem tecnica | Ex.: manual, whatsapp, importada. Existe no model, mas nao vai no payload normal da API |
| `whatsapp_account_id` | Conta WhatsApp vinculada | Usado em fluxos de WhatsApp |
| `whatsapp_alias` | Alias da conta WhatsApp | Usado em fluxos de WhatsApp |
| `provider_message_id` | ID da mensagem do provedor | Usado em fluxos de WhatsApp |
| `created_at` | Criacao | Timestamp |
| `updated_at` | Atualizacao | Timestamp |

Regras associadas:

- `TransactionUseCases._validate_links()` exige categoria para gasto.
- Se `budget_id` existe, o budget precisa ser do mesmo usuario e do mesmo `kind`.
- A API de listagem de transactions aceita filtro por `kind`, `category_id` e `search`.
- A listagem mensal retorna todos os statuses; o frontend decide o que exibir.

### Relacao

Relacao principal:

- `transactions.budget_id -> budgets.id`

Regra operacional:

- Um budget pode ter varias transactions.
- Uma transaction pode existir sem budget.
- `budget_id = NULL` indica lancamento sem previsao vinculada.
- `budget_id preenchido` indica lancamento vinculado a um budget.

## 4. Regras de classificacao

| Situacao | Regra implementada | Resultado |
|---|---|---|
| `transaction.kind = income` e `budget_id IS NULL` | transaction avulsa de entrada | Entrada avulsa |
| `transaction.kind = expense` e `budget_id IS NULL` | transaction avulsa de saida | Gasto avulso |
| `transaction.budget_id` aponta para budget com `budget_type = fixed` e `has_due_date = true` | frontend marca como conta fixa; backend trata como budget pagavel | Gasto/entrada fixa |
| `transaction.budget_id` aponta para budget com `budget_type = variable` | backend aceita o vinculo, mas o frontend de fluxo de caixa trata como avulso para exibicao | VariÃ¡vel, com risco de divergÃªncia na classificaÃ§Ã£o visual |
| `budget.kind = income` | budget previsto de entrada | Receita prevista |
| `budget.kind = expense` | budget previsto de saida | Despesa prevista |

Fonte da classificacao:

- Fonte da verdade para `kind`: `budgets.kind`, `transactions.kind` e os schemas Pydantic.
- Fonte da verdade para `budget_type`: `budgets.budget_type`.
- Fonte da verdade para realizado/previsto: `transactions.status`.
- O frontend adiciona uma segunda camada de classificacao para exibiÃ§Ã£o:
  - `frontend/src/utils/financial-classification.ts`
  - `frontend/src/components/ui/OriginBadge.tsx`
  - `frontend/src/components/transacoes/TransactionRow.tsx`

## 5. O que aparece em cada tela

### Dashboard

Fonte principal:

- Backend: `backend/app/application/dashboard/use_cases.py`
- Motor de regra: `backend/app/domain/dashboard/services.py`
- Route: `backend/app/interfaces/api/routes/dashboard_routes.py`
- Frontend: `frontend/src/components/dashboard/DashboardSummary.tsx`

| SeÃ§Ã£o | Aparece | Nao aparece | Fonte | Regra |
|---|---|---|---|---|
| Entradas realizadas | `total_income` | `pending`, `canceled` | `dashboard` | Soma transactions `paid` de tipo `income` no mes; se o mes for futuro, usa previsao de budgets |
| Gastos realizados | `total_expense` | `pending`, `canceled` | `dashboard` | Soma transactions `paid` de tipo `expense` no mes; se o mes for futuro, usa previsao de budgets |
| Economia | `economy` | saldo individual por transaction | `dashboard` | `total_income - total_expense` |
| Saldo acumulado | `accumulated_balance` | saldo por transaction individual | `dashboard` | `initial_balance` + economia acumulada desde `base_month` |
| Ganhos | `incomes` | budgets de saida | `dashboard` | Budgets ativos de `kind = income` no mes; realizado vem de transactions pagas vinculadas |
| Gastos fixos | `fixed_expenses` | budgets variaveis | `dashboard` | Budgets ativos de `kind = expense` e `budget_type = fixed` |
| Gastos variaveis | `variable_expenses` | budgets fixos | `dashboard` | Budgets ativos de `kind = expense` e `budget_type = variable` + gastos avulsos pagos sem budget |
| Contas do mes | `pending_bills`, `paid_bills` | receitas | `dashboard` | Apenas budgets pagaveis: `expense + fixed + has_due_date` |
| Para onde foi o dinheiro | `expenses_by_category` | entradas | `dashboard` | Apenas transactions `paid` de `kind = expense`, agrupadas por categoria |

Regras de inclusao e exclusao do dashboard:

- Apenas transactions `paid` entram em `real_income`, `real_expense`, `expenses_by_category` e nos realizados dos cards.
- Transactions `pending` e `canceled` nao contam como realizado.
- Budgets ativos fora do mes nao entram em `planned_total`.
- Mes futuro usa previsao; mes atual ou passado usa realizado.

Observacao:

- O frontend do dashboard nao exibe a projecao de saldo, embora `useDashboard()` busque `GET /api/projections/balance`.

### Fluxo de Caixa

Fonte principal:

- Frontend: `frontend/src/components/planejamento/PlanningSummaryCards.tsx`
- Budgets: `GET /api/budgets`
- Transactions: `GET /api/transactions`
- Bills: `GET /api/bills`

| SeÃ§Ã£o | Aparece | Nao aparece | Fonte | Regra |
|---|---|---|---|---|
| Receitas previstas | budgets de entrada ativos no mes | budgets de saida | `budgets` | `kind = income` e `activeInMonth()` |
| Receitas recebidas | transactions de entrada pagas + recebimento de budgets vinculados | transactions canceladas | `transactions` + `bills` | `status = paid` e/ou budget recebido |
| Contas pendentes | contas fixas com vencimento e sem pagamento | receitas | `bills` + `budgets` | `expense + fixed + has_due_date` |
| Contas pagas | contas fixas com vencimento e pagas | receitas | `bills` + `transactions` | same budget_id pago no mes |
| LanÃ§amentos avulsos | transactions nao classificadas como budget fixo | budgets fixos e receitas previstas | `transactions` | Regra frontend `isLooseTransaction()`; cancelados tambÃ©m aparecem na lista |

Como o frontend trata fixo e variÃ¡vel:

- Fixo: budget com `budget_type = fixed` e `kind = expense`, mostrado em `Contas fixas`.
- Entrada prevista: budget com `kind = income`, mostrado em `Receitas previstas`.
- VariÃ¡vel: ha uma secao propria de budgets variÃ¡veis no fluxo de caixa atual.
- Lancamento avulso: no frontend, tudo que nao e `budget fixed` e tratado como avulso.

Isso gera uma divergencia importante:

- O backend considera avulso principalmente o lancamento sem budget.
- O frontend do fluxo de caixa considera avulso qualquer transaction que nao seja `budget fixed`, inclusive transaction ligada a budget variÃ¡vel.

### Lancamentos

Fonte principal:

- Frontend: `frontend/src/components/transacoes/TransactionList.tsx`
- Filtros: `frontend/src/components/transacoes/TransactionFilters.tsx`
- Badge de origem: `frontend/src/components/ui/OriginBadge.tsx`
- API: `GET /api/transactions`

| SeÃ§Ã£o | Aparece | Nao aparece | Fonte | Regra |
|---|---|---|---|---|
| Lista de lancamentos | todas as transactions retornadas pela API no mes e com filtros | nenhuma por classificacao de origem | `transactions` | A tela nao filtra por `budget_id`; mostra o que a API retorna |
| Entradas filtradas | soma dos itens filtrados com `kind = income` | despesas | `transactions` | Calculado no frontend a partir do resultado da API |
| Gastos filtrados | soma dos itens filtrados com `kind = expense` | entradas | `transactions` | Calculado no frontend a partir do resultado da API |
| Saldo filtrado | diferenca entre entradas e gastos filtrados | - | `transactions` | Calculado no frontend |
| Cancelados | aparecem na lista | nao sao removidos da tela | `transactions` | A API retorna `canceled`; a tela exibe e o fluxo de caixa tambÃ©m mostra |

Ordem/rotulo visual:

- `StatusBadge` deriva status visual do `transaction.status` e da data.
- `OriginBadge` deriva origem de:
  - `Conta fixa` se `is_fixed_bill = true`
  - `Receita prevista` se houver `budget_id` e `kind = income`
  - `Manual` nos demais casos

### Contas

Fonte principal:

- Frontend: `frontend/src/components/contas/BillsList.tsx`
- Item: `frontend/src/components/contas/BillRow.tsx`
- API: `GET /api/bills`

| SeÃ§Ã£o | Aparece | Nao aparece | Fonte | Regra |
|---|---|---|---|---|
| Contas a pagar | budgets pagaveis do mes sem transaction paga | receitas e budgets sem vencimento | `bills.pending` | `expense + fixed + has_due_date` e sem pagamento |
| Contas pagas | budgets pagaveis do mes com transaction paga | receitas | `bills.paid` | mesma regra, com `paid = true` |
| Receitas | nao aparece nesta tela | receitas previstas/recebidas | - | A tela de Contas hoje e exclusiva para contas fixas de saida |

Como cria/edita/exclui:

- A tela de Contas nao cria budgets.
- A tela de Contas nao edita budgets.
- A tela de Contas nao exclui budgets.
- Ela apenas alterna `pay/unpay`, o que cria ou remove transactions pagas para budgets pagaveis.

## 6. Endpoints envolvidos

| Endpoint | Metodo | Responsabilidade | Regras aplicadas | Arquivo |
|---|---|---|---|---|
| `/api/dashboard` | `GET` | Retorna resumo consolidado do mes | Calcula realizado, previsto, economia, saldo acumulado, contas e ranking | `backend/app/interfaces/api/routes/dashboard_routes.py` + `backend/app/application/dashboard/use_cases.py` |
| `/api/budgets` | `GET` | Lista budgets do usuario | Retorna apenas `active = true` e faz join com category | `backend/app/interfaces/api/routes/budget_routes.py` |
| `/api/budgets` | `POST` | Cria budget | Valida categoria vs kind; zera `end_month` para fixed | `backend/app/interfaces/api/routes/budget_routes.py` |
| `/api/budgets/{budget_id}` | `PUT` | Atualiza budget | Mesmas regras de criacao | `backend/app/interfaces/api/routes/budget_routes.py` |
| `/api/budgets/{budget_id}` | `DELETE` | Remove budget e suas transactions | Deleta transactions vinculadas antes do budget | `backend/app/interfaces/api/routes/budget_routes.py` |
| `/api/transactions` | `GET` | Lista transactions do mes | Filtra por `kind`, `category_id`, `search`; lista tudo no mes | `backend/app/interfaces/api/routes/transaction_routes.py` |
| `/api/transactions` | `POST` | Cria transaction | Valida category e link com budget | `backend/app/interfaces/api/routes/transaction_routes.py` |
| `/api/transactions/{transaction_id}` | `PUT` | Atualiza transaction | Mesmas regras da criacao | `backend/app/interfaces/api/routes/transaction_routes.py` |
| `/api/transactions/{transaction_id}` | `DELETE` | Remove transaction | Pode deletar budget se for o ultimo lancamento vinculado | `backend/app/interfaces/api/routes/transaction_routes.py` |
| `/api/bills` | `GET` | Lista contas do mes | Considera apenas budgets pagaveis | `backend/app/interfaces/api/routes/bill_routes.py` |
| `/api/bills/{budget_id}/pay` | `POST` | Marca conta fixa como paga | Deleta pagamento anterior do mesmo budget/mes e cria transaction paid | `backend/app/interfaces/api/routes/bill_routes.py` |
| `/api/bills/{budget_id}/unpay` | `POST` | Desmarca conta fixa como paga | Remove transaction paid do budget/mes | `backend/app/interfaces/api/routes/bill_routes.py` |
| `/api/bills/{budget_id}/receive` | `POST` | Marca receita prevista como recebida | Cria transaction paid de income | `backend/app/interfaces/api/routes/bill_routes.py` |
| `/api/bills/{budget_id}/unreceive` | `POST` | Desmarca receita recebida | Remove transaction paid do budget/mes | `backend/app/interfaces/api/routes/bill_routes.py` |
| `/api/categories` | `GET` | Lista categorias | Filtra por `income` ou `expense` | `backend/app/interfaces/api/routes/category_routes.py` |
| `/api/projections/balance` | `GET` | Projecao de saldo | Usa budgets e saldo inicial | `backend/app/interfaces/api/routes/projection_routes.py` |

## 7. Componentes frontend envolvidos

| Tela/Componente | Responsabilidade | Regra aplicada | Arquivo |
|---|---|---|---|
| `DashboardPage` | Exibe KPIs e quadros do dashboard | Usa payload consolidado do backend | `frontend/src/components/dashboard/DashboardSummary.tsx` |
| `IncomePanel` | Exibe ganhos previstos | Mostra budgets de entrada e valor realizado quando vier como `transaction` | `frontend/src/components/dashboard/IncomePanel.tsx` |
| `FixedExpensesPanel` | Exibe gastos fixos | Mostra budgets `expense/fixed` com barra de progresso | `frontend/src/components/dashboard/FixedExpensesPanel.tsx` |
| `VariableExpensesPanel` | Exibe gastos variaveis | Mostra budgets `expense/variable` e lancamentos avulsos de saida | `frontend/src/components/dashboard/VariableExpensesPanel.tsx` |
| `BillsPanel` | Exibe contas do mes | Mostra pendentes e pagas | `frontend/src/components/dashboard/BillsPanel.tsx` |
| `CategoryDonutChart` | Mostra distribuicao de gastos | Usa apenas `expenses_by_category` do backend | `frontend/src/components/dashboard/CategoryDonutChart.tsx` |
| `PlanningPage` | Exibe fluxo de caixa | Reclassifica budgets e transactions no frontend | `frontend/src/components/planejamento/PlanningSummaryCards.tsx` |
| `CashFlowBudgetRow` | Linha de budget no fluxo de caixa | Define status e permissao de toggle por `kind`, `budget_type` e `has_due_date` | `frontend/src/components/planejamento/PlanningSummaryCards.tsx` |
| `CashFlowTransactionRow` | Linha de lancamento avulso | Define status visual por `status` e data | `frontend/src/components/planejamento/PlanningSummaryCards.tsx` |
| `BudgetFormModal` | Criacao/edicao de budget | Filtra categoria por tipo, controla `kind`, `budget_type`, `due_day` | `frontend/src/components/planejamento/BudgetFormModal.tsx` |
| `TransactionFormModal` | Criacao/edicao de transaction | Filtra categoria por tipo, exige categoria em gasto | `frontend/src/components/transacoes/TransactionFormModal.tsx` |
| `TransactionsPage` | Lista e gerencia lancamentos | Exibe todos os statuses recebidos da API | `frontend/src/components/transacoes/TransactionList.tsx` |
| `TransactionRow` | Linha da lista de lancamentos | Usa `OriginBadge` e `StatusBadge` | `frontend/src/components/transacoes/TransactionRow.tsx` |
| `OriginBadge` | Mostra origem funcional da transaction | Classifica como conta fixa, receita prevista ou manual | `frontend/src/components/ui/OriginBadge.tsx` |
| `BillsPage` | Tela de contas | Mostra apenas contas pagaveis do mes | `frontend/src/components/contas/BillsList.tsx` |
| `BillRow` | Linha da tela de contas | Status pago/pendente | `frontend/src/components/contas/BillRow.tsx` |
| `useDashboard` | Carrega dashboard | Busca dashboard + projection | `frontend/src/hooks/useDashboard.ts` |
| `useBudgets` | Carrega budgets | CRUD via API | `frontend/src/hooks/useBudgets.ts` |
| `useTransactions` | Carrega transactions | CRUD via API e filtros | `frontend/src/hooks/useTransactions.ts` |
| `useCategories` | Carrega categorias | Separa por tipo | `frontend/src/hooks/useCategories.ts` |
| `isFixedBudgetTransaction` | Classificacao auxiliar | Usa `budget_id` + `budget_type` | `frontend/src/utils/financial-classification.ts` |
| `isLooseTransaction` | Classificacao auxiliar | Tudo que nao e budget fixo | `frontend/src/utils/financial-classification.ts` |

## 8. Regras de exclusao

### Excluir budget

Implementacao atual:

- Endpoint: `DELETE /api/budgets/{budget_id}`
- Fluxo: o backend busca o budget, deleta todas as transactions vinculadas com `delete_by_budget_id()` e depois remove o budget.
- O commit e feito uma unica vez no final.

Resultado:

- Ao excluir budget, as transactions vinculadas tambem sao removidas pela aplicacao.
- Se houver drafts de WhatsApp ligados a essas transactions, o backend faz unlink antes da exclusao.

### Excluir transaction

Implementacao atual:

- Endpoint: `DELETE /api/transactions/{transaction_id}`
- Fluxo: o backend remove a transaction.
- Se a transaction removida era a ultima vinculada ao budget, o backend tambem remove o budget.

Resultado:

- Ao excluir transaction, o budget pode ser excluido apenas quando nao restar nenhuma transaction vinculada.
- Transaction avulsa (`budget_id = NULL`) nao afeta budget algum.

### Cascade no banco

- Nao existe `ON DELETE CASCADE` nas FKs de `budgets` e `transactions` no schema Postgres.
- A limpeza e feita pela aplicacao.
- O relacionamento e sensivel a ordem de exclusao, entao uma falha no fluxo pode deixar a operacao inconsistente.

### Risco de orfaos

- O risco principal nao e de orfao por cascade inexistente, e sim de regra parcial se algum delete for feito fora do backend.
- O banco impede a exclusao direta de um budget com transactions dependentes, porque a FK nao tem cascade.
- O backend resolve isso deletando transactions antes do budget.

## 9. Inconsistencias encontradas

| Inconsistencia | Impacto | Arquivo/endpoint | Sugestao futura |
|---|---|---|---|
| `fluxo-de-caixa` nao exibe budgets `expense/variable` como secao propria | Budgets variaveis podem existir e nao aparecer claramente na tela de fluxo | `frontend/src/components/planejamento/PlanningSummaryCards.tsx` | Centralizar a regra de exibicao de variaveis e criar secao especifica se esse for o comportamento esperado |
| Frontend classifica avulso por "nao e fixed" enquanto backend classifica avulso por "sem budget" | Transaction ligada a budget variÃ¡vel pode aparecer como avulsa no frontend, mas nao entra como avulsa no backend do dashboard | `frontend/src/utils/financial-classification.ts` vs `backend/app/domain/dashboard/services.py` | Manter a divergÃªncia documentada ate unificar regra de negÃ³cio |
| `due_day` e tratado de forma diferente no backend e no frontend | Datas de vencimento acima de 28 podem divergir entre criacao de transaction e calculo visual de atraso | `backend/app/domain/shared.py` e `frontend/src/components/planejamento/PlanningSummaryCards.tsx` | Padronizar a regra de data limite |
| `Dashboard` busca projection, mas a tela nao renderiza o grafico de projeÃ§Ã£o | Endpoint e custo de leitura sem beneficio visual atual | `frontend/src/hooks/useDashboard.ts` e `frontend/src/components/dashboard/BalanceProjectionChart.tsx` | Remover o fetch ou renderizar o componente |
| `source`, `whatsapp_account_id`, `whatsapp_alias` e `provider_message_id` existem no model, mas nao saem no payload de transaction | Origem tecnica nao aparece nos lancamentos da API | `backend/app/infrastructure/db/models.py` + `backend/app/application/transactions/use_cases.py` | Se a origem for relevante para negocio, expor em schema e UI |
| `transactions.category_id` e nullable no schema/runtime atual, mas o arquivo `database/schema.sql` antigo marcava como obrigatorio | Divergencia entre scripts de schema | `database/schema.sql` vs `database/postgres/schema.sql` | Tratar `database/postgres/schema.sql` como referencia atual para PostgreSQL |
| `BudgetUpdate` e `TransactionUpdate` sao PUT completos, nao PATCH | Frontend precisa mandar payload completo para editar | `backend/app/application/budgets/schemas.py` e `backend/app/application/transactions/schemas.py` | Se quiser edicao parcial, trocar o contrato de API |
| `TransactionRow` mostra cancelados e o fluxo de caixa tambÃ©m | Usuarios veem cancelado nas duas telas | `frontend/src/components/transacoes/TransactionList.tsx` vs `frontend/src/components/planejamento/PlanningSummaryCards.tsx` | Regra unificada: cancelado aparece, mas nao entra nos totais realizados |

## 9.1 Ambiguidades de regra e comportamento recomendado

| Inconsistencia | Impacto | Tela/Painel | Sugestao de comportamento |
|---|---|---|---|
| Conta fixa com recorrÃªncia variÃ¡vel | JÃ¡ hÃ¡ rÃ³tulo explÃ­cito para `VariÃ¡vel` e o budget salva como `budget_type = variable` | `Fluxo de Caixa` | Regra e UX agora estÃ£o alinhadas: `Fixa / VariÃ¡vel` |
| Frontend trata avulso como "nao fixed" e backend como "sem budget" | Transaction ligada a budget variÃ¡vel pode ser avulsa no front, mas nao no backend | `Fluxo de Caixa`, `Dashboard`, `LanÃ§amentos` | Manter a divergÃªncia documentada atÃ© unificar regra de negÃ³cio |
| "Contas do mes" so aceita despesa fixa com vencimento, mas a UX mistura conta fixa com recorrencia | Usuario pode cadastrar algo com comportamento diferente do esperado | `Contas` | Se o objetivo for conta fixa, exigir `budget_type = fixed` + `has_due_date = true` na mesma UX |
| Dashboard mistura gasto variÃ¡vel previsto com gasto avulso realizado | Pode confundir previsao com realizado | `Dashboard` | Separar visualmente "variÃ¡vel previsto" de "variÃ¡vel realizado" ou explicitar no subtitulo |
| Dashboard busca projeÃ§Ã£o, mas o componente nao e exibido | Custo de carregamento sem beneficio visual | `Dashboard` | Ou remover o fetch, ou renderizar o grafico de projeÃ§Ã£o |
| A tela fala em contas atrasadas, mas a UI separa apenas pendentes e pagas | Terminologia incompleta | `Contas` | Criar uma terceira secao "Atrasadas" ou remover o termo da descricao |
| Regra de vencimento difere entre backend e frontend | Possivel divergencia em datas de pagamento | `Fluxo de Caixa` | Padronizar a regra de vencimento em um unico ponto |
| category_id e nullable no banco, mas obrigatorio na API de budget | Divergencia entre schema e dominio | `Backend` | Decidir se categoria e realmente obrigatoria no dominio e alinhar banco, API e UI |
| "Receita prevista" e "Conta fixa" sao rÃ³tulos visuais, nao tipos reais | Pode confundir o usuario sobre origem vs classificacao | `LanÃ§amentos` | Distinguir no UI origem, tipo e recorrencia de forma separada |
| A tela de lancamentos e o fluxo de caixa mostram cancelados | O mesmo registro aparece nas duas telas | `LanÃ§amentos`, `Fluxo de Caixa` | PolÃ­tica Ãºnica: mostrar cancelados, sem contabilizÃ¡-los como realizado |

## 10. Regras funcionais consolidadas

1. A fonte da verdade para `kind` e `income|expense` e a coluna `kind` em `budgets` e `transactions`.
2. A fonte da verdade para fixo/variÃ¡vel e `budgets.budget_type`.
3. A fonte da verdade para realizado/pendente/cancelado e `transactions.status`.
4. Um budget pode representar tanto entrada quanto saida; o `kind` define isso.
5. Um budget fixo de saida com vencimento e o unico item que entra na tela de Contas como conta pagavel.
6. Uma transaction pode existir sem budget; nesse caso ela e tratada como lancamento avulso pelo backend.
7. O frontend do fluxo de caixa trata como avulso tudo que nao e budget fixo, o que diverge do backend.
8. `transactions.kind = income` representa entrada, e `transactions.kind = expense` representa saida.
9. `transactions.status = paid` e o unico status contado como realizado no dashboard.
10. Cancelados nao contam como realizado no dashboard e aparecem no fluxo de caixa com status prÃ³prio.
11. O dashboard mostra ganhos, gastos fixos, gastos variaveis, contas do mes e distribuicao por categoria.
12. A tela de Lancamentos mostra todas as transactions do mes retornadas pela API, inclusive canceladas.
13. A tela de Contas mostra apenas budgets pagaveis de saida fixa com vencimento.
14. Excluir budget apaga as transactions vinculadas por regra de backend.
15. Excluir transaction pode apagar o budget se ela for a ultima transaction ligada a ele.
16. Nao existe cascade automatico no banco para `budgets` e `transactions`; a limpeza e feita pela aplicacao.
17. A categoria do budget/transaction deve ter o mesmo tipo do `kind`.
18. Gasto sem categoria e bloqueado no backend.
19. No dashboard, mes futuro usa previsao de budgets; mes atual ou passado usa transactions pagas.
20. A regra de avulso, hoje, nao esta centralizada e pode divergir entre backend e frontend.

## 11. Cenarios de testes funcionais

### 11.1 Cenarios esperados como aprovados

| ID | Cenario | Precondicao | Passos | Resultado esperado | Tela/Painel | Status esperado |
|---|---|---|---|---|---|---|
| TF-01 | Criar budget de receita recorrente | Usuario autenticado | Abrir Fluxo de Caixa, criar budget com `kind = income`, `budget_type = fixed`, categoria de income, valor valido | Budget salvo como receita prevista recorrente | `Fluxo de Caixa` | Aprova |
| TF-02 | Criar budget de despesa fixa com vencimento | Usuario autenticado | Criar budget com `kind = expense`, `budget_type = fixed`, `has_due_date = true`, `due_day` valido | Budget salvo como conta fixa recorrente | `Fluxo de Caixa` | Aprova |
| TF-03 | Criar transaction avulsa de entrada | Usuario autenticado | Criar transaction com `kind = income`, `budget_id = null`, categoria opcional, status `paid` | Transaction salva como lancamento avulso de entrada | `LanÃ§amentos` | Aprova |
| TF-04 | Criar transaction avulsa de saida | Usuario autenticado | Criar transaction com `kind = expense`, `budget_id = null`, categoria obrigatoria, status `paid` | Transaction salva como lancamento avulso de saida | `LanÃ§amentos` | Aprova |
| TF-05 | Pagar conta fixa do mes | Budget fixo pagavel existe | Abrir Contas e acionar pagar | System cria transaction `paid` vinculada ao budget e a conta sai de pendente | `Contas`, `Dashboard`, `Fluxo de Caixa` | Aprova |
| TF-06 | Receber receita prevista | Budget de income fixo existe | Abrir Fluxo de Caixa e marcar receita como recebida | System cria transaction `paid` de income vinculada ao budget | `Fluxo de Caixa`, `Dashboard` | Aprova |
| TF-07 | Excluir budget com transactions vinculadas | Budget com transactions existe | Excluir budget | Transactions vinculadas tambem sao removidas | `Fluxo de Caixa` | Aprova |
| TF-08 | Excluir a ultima transaction vinculada ao budget | Budget com uma unica transaction existe | Excluir transaction | Budget tambem e removido | `LanÃ§amentos`, `Fluxo de Caixa` | Aprova |
| TF-09 | Exibir entradas realizadas no dashboard do mes atual | Existem transactions paid de income no mes | Abrir Dashboard | KPI de entradas mostra soma dos incomes paid | `Dashboard` | Aprova |
| TF-10 | Exibir gastos realizados no dashboard do mes atual | Existem transactions paid de expense no mes | Abrir Dashboard | KPI de gastos mostra soma dos expenses paid | `Dashboard` | Aprova |
| TF-11 | Listar contas pendentes do mes | Existem budgets `expense/fixed/has_due_date` sem payment | Abrir Contas | Budget aparece em "Contas a pagar" | `Contas` | Aprova |

### 11.2 Cenarios que hoje devem falhar ou estao inconsistentes

| ID | Cenario | Precondicao | Passos | Resultado observado hoje | Tela/Painel | Status esperado |
|---|---|---|---|---|---|---|
| TF-F01 | Conta fixa com recorrÃªncia variÃ¡vel | Usuario autenticado | Criar budget com `kind = expense`, selecionar recorrÃªncia `VariÃ¡vel` na UX | Budget salva como `budget_type = variable` com rÃ³tulo de despesa programada | `Fluxo de Caixa` | Aprova |
| TF-F02 | Transaction ligada a budget variable ser tratada como avulsa no fluxo | Existe transaction com `budget_id` apontando para budget `variable` | Abrir Fluxo de Caixa | Frontend pode classificar como avulsa, mesmo nao sendo `budget_id = null` | `Fluxo de Caixa` | Falha conhecida |
| TF-F03 | Achar budget variavel como conta do mes | Existe budget `expense/variable` | Abrir Fluxo de Caixa | Budget aparece em "Despesas variáveis" | `Fluxo de Caixa` | Aprova |
| TF-F04 | Ver projeÃ§Ã£o do saldo no dashboard | Usuario com dashboard carregado | Abrir Dashboard | `useDashboard` carrega projection, mas a tela nao renderiza o grafico | `Dashboard` | Falha conhecida |
| TF-F05 | Exibir cancelados no fluxo de caixa como itens da mesma forma que em lancamentos | Existem transactions `canceled` no mes | Abrir Fluxo de Caixa | `PlanningSummaryCards` exibe `canceled` na lista de avulsos | `Fluxo de Caixa` | Aprova |
| TF-F06 | Usar a mesma regra de vencimento entre front e backend | Budget com `due_day > 28` | Comparar status de atraso no front e no backend | Pode haver divergencia porque o front calcula ate o ultimo dia do mes e o backend limita em 28 | `Fluxo de Caixa`, `Contas` | Falha conhecida |
| TF-F07 | Mostrar "conta fixa" sem vencimento na lista de contas | Budget `expense/fixed` sem `has_due_date` | Abrir Contas | Item nao aparece em Contas a pagar; comportamento esperado | `Contas` | Aprova |
| TF-F08 | Exibir categoria obrigatÃ³ria em budget | Banco permite `category_id` nullable, mas API exige categoria | Tentar criar budget sem categoria | API barra a criacao; esse bloqueio Ã© esperado | `Fluxo de Caixa` | Aprova |

### 11.3 Cenarios de regressao recomendados

| ID | Cenario | Objetivo | Tela/Painel |
|---|---|---|---|
| TR-01 | Criar budget income fixed e depois recebÃª-lo | Garantir que a conversao de previsao para realizado nao duplica valor | `Fluxo de Caixa`, `Dashboard` |
| TR-02 | Criar budget expense fixed e depois pagÃ¡-lo e desfazer | Garantir que `pay/unpay` alterna corretamente `pending` e `paid` | `Contas` |
| TR-03 | Criar transaction avulsa, editar status para canceled e voltar | Garantir consistencia de filtro e status visual | `LanÃ§amentos`, `Fluxo de Caixa` |
| TR-04 | Excluir uma transaction vinculada e verificar exclusao do budget quando ultimo vinculo | Garantir limpeza bidirecional atual | `LanÃ§amentos`, `Fluxo de Caixa` |
| TR-05 | Comparar o mesmo mes em passado, atual e futuro no dashboard | Garantir troca entre realizado e previsto | `Dashboard` |

