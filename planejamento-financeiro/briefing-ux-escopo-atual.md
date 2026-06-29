# DinCon - Briefing de UX, componentes, dados e comportamentos atuais

Este documento descreve o estado atual do frontend do DinCon para apoiar uma analise de reestruturacao visual e de usabilidade sem sair do escopo funcional existente.

## Objetivo da plataforma

Sistema financeiro pessoal com:

- Dashboard mensal.
- Fluxo de caixa mensal.
- Lancamentos/transacoes.
- Contas fixas a pagar.
- Cofrinho/investimentos.
- Perfil e integracao WhatsApp.
- Autenticacao por e-mail/senha com verificacao por SMS via Twilio Verify.
- Registro financeiro via WhatsApp por texto/audio.
- Gateway de pagamento Mercado Pago.

## Rotas e telas

### `/`

Landing page publica.

Componentes/conteudo:

- Hero com logo/proposta.
- Cards de beneficio.
- Metricas ilustrativas.
- Links para login/cadastro.

Observacao:

- Tem cara de LP; nao usa dados reais do usuario.

### `/login`

Tela de entrada.

Componentes:

- `AuthShell`
- `PasswordField`
- Formularios de login e verificacao SMS quando conta nao esta verificada.

Dados:

- `email`
- `password`
- `verificationCode`

Comportamento:

- `POST /api/auth/login`
- Se backend retorna `email_not_verified`, mostra formulario para informar codigo SMS.
- Permite reenviar codigo SMS.
- Se existe mensagem temporaria em `sessionStorage` apos redefinir senha, mostra sucesso.

### `/cadastro`

Cadastro de usuario.

Componentes:

- `AuthShell`
- `PhoneField`
- `PasswordField`

Dados:

- `name`
- `email`
- `phone`
- `password`
- `confirmPassword`
- `verificationCode`

Comportamento:

- Primeira etapa cria usuario pendente.
- Envia codigo SMS via Twilio Verify.
- Segunda etapa valida codigo.
- Depois de verificar, usuario pode logar.

### `/esqueci-senha`

Recuperacao de senha.

Componentes:

- `AuthShell`
- `PasswordField`

Dados:

- `email`
- `code`
- `password`
- `confirmPassword`

Comportamento:

- `POST /api/auth/password-reset/start`
- Envia codigo SMS para celular cadastrado.
- `POST /api/auth/password-reset/confirm`
- Ao confirmar codigo e redefinir senha, redireciona para `/login`.

### `/dashboard`

Tela principal mensal.

Componente raiz:

- `DashboardPage` em `components/dashboard/DashboardSummary.tsx`

Componentes visuais:

- `KpiCard`
- `IncomePanel`
- `FixedExpensesPanel`
- `VariableExpensesPanel`
- `BillsPanel`
- `CategoryDonutChart`
- `BalanceProjectionChart`
- `RankingCard`

Dados carregados:

- `GET /api/dashboard?user_id={id}&month_key=YYYY-MM`
- `GET /api/projections/balance?user_id={id}&months=12`

Comportamento:

- Usa `monthKey` global do `FinanceShell`.
- Exibe dados mensais planejados, realizados, contas, categorias e projecao.
- Nao tem FAB proprio.

### `/planejamento`

Hoje exibida como "Fluxo de caixa".

Componente raiz:

- `PlanningPage` em `components/planejamento/PlanningSummaryCards.tsx`

Componentes visuais:

- `CashFlowKpi`
- `StatusMetric`
- `CashFlowSection`
- `CashFlowBudgetRow`
- `CashFlowTransactionRow`
- `BudgetFormModal`
- `TransactionFormModal`
- `RowActionsMenu`
- FAB com menu:
  - Nova entrada
  - Nova transacao
- Tooltip com icone `Info`.

Dados carregados:

- `GET /api/budgets?user_id={id}`
- `GET /api/transactions?user_id={id}&month_key=YYYY-MM`
- `GET /api/bills?user_id={id}&month_key=YYYY-MM`
- `GET /api/categories`

Comportamento atual:

- Agrupa `budgets` em:
  - Saidas fixas: `kind=expense`, `budget_type=fixed`, ativo no mes.
  - Entradas previstas: `kind=income`, ativo no mes.
- Transacoes variaveis do mes entram pela lista de `transactions`.
- Gasto fixo com vencimento pode ser marcado como pago.
- Entrada prevista pode ser marcada como recebida.
- Ao marcar gasto fixo como pago:
  - `POST /api/bills/{budget_id}/pay`
  - Backend cria uma transacao `expense` vinculada ao budget.
- Ao desfazer pagamento:
  - `POST /api/bills/{budget_id}/unpay`
  - Backend remove a transacao vinculada do mes.
- Ao marcar entrada prevista como recebida:
  - `POST /api/bills/{budget_id}/receive`
  - Backend cria uma transacao `income` vinculada ao budget.
- Ao desfazer recebimento:
  - `POST /api/bills/{budget_id}/unreceive`
  - Backend remove a transacao vinculada do mes.
- Transacoes vinculadas a entrada prevista nao aparecem duplicadas como lancamentos avulsos.
- Status possiveis exibidos:
  - Pago
  - Recebido
  - Pendente
  - Atrasado
  - Previsto

Pontos de confusao provaveis:

- `budget` e `transaction` aparecem na mesma tela como conceitos diferentes.
- "Nova entrada" cria previsao fixa/recorrente, nao uma transacao avulsa.
- "Nova transacao" cria lancamento real/variavel do mes.
- Contas fixas e entradas previstas usam o mesmo componente visual, mas comportamentos diferentes.
- O termo "Planejamento" ainda existe internamente como rota e nome de componente, embora a UI diga "Fluxo de caixa".

### `/transacoes`

Tela de lancamentos reais do mes.

Componente raiz:

- `TransactionsPage` em `components/transacoes/TransactionList.tsx`

Componentes visuais:

- `TransactionFilters`
- Cards de totais:
  - Entradas filtradas
  - Gastos filtrados
- Lista de lancamentos.
- `TransactionRow`
- `TransactionFormModal`
- FAB com simbolo `+`.

Dados:

- `GET /api/transactions?user_id={id}&month_key=YYYY-MM`
- Filtros:
  - `kind`
  - `category_id`
  - `search`
- `POST /api/transactions`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`

Campos do formulario:

- Descricao
- Tipo: Gasto ou Entrada
- Status: Pago, Pendente, Cancelado
- Categoria
- Valor
- Data

Comportamento:

- Entrada pode ficar sem categoria.
- Gasto exige categoria.
- Data usa formato visual `dd/mm/aaaa` via `DateInput`.
- A lista mostra se transacao veio de conta fixa (`is_fixed_bill`).

### `/contas`

Contas a pagar.

Componente raiz:

- `BillsPage` em `components/contas/BillsList.tsx`

Componentes visuais:

- Dois cards:
  - Contas a pagar
  - Contas pagas
- `BillRow`
- Botao iconico:
  - Check para marcar como paga.
  - Voltar para pendente.

Dados:

- `GET /api/bills?user_id={id}&month_key=YYYY-MM`
- `POST /api/bills/{budget_id}/pay`
- `POST /api/bills/{budget_id}/unpay`

Comportamento:

- So lista budgets `expense`, `fixed`, com vencimento e ativos no mes.
- Nao lista entradas/salarios.

### `/cofrinho`

Investimentos/projecoes.

Componente raiz:

- `SavingsDashboard`

Componentes visuais:

- `SavingsKpiCard`
- `SavingsProjectionChart`
- `SavingsDistributionChart`
- `SavingsInvestmentList`
- `SavingsInvestmentRow`
- `SavingsInvestmentFormModal`
- `SavingsEmptyState`
- FAB com `+`.

Dados:

- `GET /api/savings/dashboard?user_id={id}&months=12`
- `GET /api/savings/investments?user_id={id}`
- `POST /api/savings/investments`
- `PUT /api/savings/investments/{id}`
- `DELETE /api/savings/investments/{id}`
- `GET /api/savings/projection?user_id={id}&months=12`

Campos do formulario:

- Nome do investimento
- Descricao
- Valor inicial
- Aporte mensal
- Tipo de juros:
  - Sem rendimento
  - Juros simples
  - Juros compostos
- Percentual
- Periodo:
  - Mensal
  - Anual
- Mes de inicio
- Mes de termino
- Checkbox sem data de termino

Comportamento:

- Backend calcula projecao.
- Frontend nao calcula juros.
- Modal abre pelo FAB ou pelo menu de editar.

### `/perfil`

Dados cadastrais e WhatsApp.

Componente raiz:

- `ProfilePage`

Componentes visuais:

- `ProfileForm`
- `WhatsappIntegrationCard`
- `PhoneField`
- `InternationalPhoneField`

Dados:

- `GET /api/users/{id}`
- `PUT /api/users/{id}`
- `GET /api/integrations/whatsapp/accounts?user_id={id}`
- `POST /api/integrations/whatsapp/accounts`
- `DELETE /api/integrations/whatsapp/accounts/{id}`

Campos exibidos:

- E-mail
- Status da conta:
  - Celular verificado por SMS
  - Pendente de verificacao por SMS
- Celular
- Nome
- WhatsApp vinculado

Comportamento:

- Salva perfil e atualiza sessao local.
- WhatsApp exige formato internacional.
- Apenas um vinculo WhatsApp ativo aparece.

### `/planos`, `/checkout`, `/minha-assinatura`

Fluxo de pagamento Mercado Pago.

Dados:

- `GET /api/billing/plans`
- `GET /api/billing/config`
- `GET /api/billing/me?user_id={id}`
- `POST /api/billing/checkout/pix`
- `POST /api/billing/checkout/card`
- `GET /api/billing/payments/{payment_id}?user_id={id}`

Comportamento:

- Lista planos.
- Cria checkout Pix ou cartao.
- Exibe assinatura/pagamentos do usuario.

## Layout global

### `FinanceShell`

Responsavel por:

- Proteger rotas com `AuthGuard`.
- Buscar usuario da sessao local.
- Controlar mes global via `useMonth`.
- Exibir:
  - `Sidebar`
  - `Topbar`
  - conteudo da rota ativa
  - `MobileNav`
  - `Toast`

### `Sidebar`

Menu desktop:

- Dashboard
- Fluxo de caixa
- Transacoes
- Contas
- Cofrinho
- Perfil

Usa icones `lucide-react`.

Observacao:

- Ha problema de encoding em alguns textos: `TransaÃ§Ãµes`, `DÃ­ncon`.

### `MobileNav`

Menu inferior mobile com os mesmos itens principais, mas apenas icones.

### `Topbar`

Exibe:

- Titulo e subtitulo da tela.
- Navegador de mes, exceto em Perfil e Cofrinho.
- Menu da conta logada.

Menu da conta:

- Dados cadastrais
- Trocar senha
- Minha assinatura
- Sair

## Componentes visuais reutilizaveis

### `Button`

Props:

- `variant`: `default` ou `primary`
- `icon`
- `square`

Usa classes:

- `cf-btn`
- `primary`
- `cf-icon-btn`

### `Card`

Container padrao de secao.

Props:

- `title`
- `meta`
- `children`
- `className`

Usa:

- `cf-card`
- `cf-card-head`

### `Modal`

Overlay generico.

Props:

- `title`
- `children`
- `onClose`

Usa botao X no canto superior.

### `RowActionsMenu`

Menu de tres pontos por linha.

Acoes:

- Editar
- Excluir/remover

### `MonthNavigator`

Navegador mensal.

Mostra `monthKey` no formato `YYYY-MM`.

### `Money`

Exibe moeda.

Props:

- `value`
- `size`: `sm`, `md`, `lg`
- `tone`: `income`, `expense`, `neutral`

### `CurrencyInput`

Input monetario.

Usado em:

- BudgetFormModal
- TransactionFormModal
- SavingsInvestmentFormModal

### `DateInput`

Input de data com exibicao `dd/mm/aaaa`.

Usado em transacoes.

### `EmptyState`

Estado vazio generico.

### `Toast`

Feedback global via `useToast`.

## Dicionario de dados

### Usuario (`User`)

Campos:

- `id`: identificador.
- `name`: nome.
- `email`: e-mail.
- `phone`: celular.
- `initial`: inicial/avatar.
- `initial_balance`: saldo inicial, ainda existe no tipo mas nao deveria ser foco visual.
- `base_month`: mes base, ainda existe no tipo mas nao deveria ser foco visual.
- `budget_count`: quantidade de budgets.
- `transaction_count`: quantidade de transacoes.
- `database_connected`: status da conexao.
- `active`: conta ativa.
- `email_verified`: atualmente representa conta/celular verificado por SMS.
- `verification_status`: status tecnico da verificacao.

### Categoria (`Category`)

Campos:

- `id`
- `name`
- `type`: `income` ou `expense`
- `icon_key`
- `color`
- `active`

Uso:

- Classifica entradas e gastos.
- WhatsApp/IA pode criar categoria automaticamente.

### Budget / Planejamento / Fluxo de caixa (`Budget`)

Campos:

- `id`
- `user_id`
- `description`: descricao.
- `kind`: `income` ou `expense`.
- `category_id`
- `budget_type`: `fixed` ou `variable`.
- `amount`
- `start_month`: inicio no formato `YYYY-MM`.
- `end_month`: fim no formato `YYYY-MM` ou nulo.
- `has_due_date`: indica vencimento.
- `due_day`: dia do vencimento.
- `active`
- `category_name`
- `category_color`
- `category_icon_key`

Regras atuais:

- Budget fixo e recorrente.
- Budget variavel existe no modelo, mas o fluxo atual tenta tratar variaveis como transacoes.
- Conta fixa pagavel: `kind=expense`, `budget_type=fixed`, `has_due_date=true`.
- Entrada prevista: `kind=income`.

### Transacao (`Transaction`)

Campos:

- `id`
- `user_id`
- `budget_id`: opcional; quando preenchido, transacao veio de uma previsao/conta.
- `category_id`
- `kind`: `income` ou `expense`.
- `title`
- `amount`
- `transaction_date`: `YYYY-MM-DD`.
- `status`: `paid`, `pending`, `canceled`.
- `category_name`
- `category_color`
- `budget_description`
- `budget_type`
- `is_fixed_bill`

Regras atuais:

- Transacao representa lancamento real/variavel.
- Gasto exige categoria.
- Entrada pode ficar sem categoria.
- `status=paid` entra como realizado.
- `pending` pode aparecer como pendente/atrasado.

### Conta (`Bill`)

Objeto derivado de budget + transacoes do mes.

Campos:

- `budget_id`
- `description`
- `amount`
- `due_day`
- `category_id`
- `category_name`
- `category_color`
- `paid`

Uso:

- Tela `/contas`.
- Fluxo de caixa para contas fixas.

### Dashboard (`Dashboard`)

Campos principais:

- `month_key`
- `month_label`
- `is_past`
- `is_current`
- `is_projected`
- `total_income`
- `total_expense`
- `economy`
- `saving_rate`
- `accumulated_balance`
- `planned_income`
- `planned_expense`
- `planned_fixed_expense`
- `planned_variable_expense`
- `real_income`
- `real_expense`
- `fixed_expenses`
- `variable_expenses`
- `incomes`
- `pending_bills`
- `paid_bills`
- `pending_total`
- `expenses_by_category`
- `ranking_position`
- `ranking_label`

### Linha de dashboard (`DashboardLine`)

Campos:

- `id`
- `description`
- `amount`
- `realized`
- `category`
- `color`
- `due_day`
- `paid`
- `budget_type`

### Cofrinho (`SavingsInvestment`)

Campos:

- `id`
- `user_id`
- `name`
- `description`
- `initial_amount`
- `monthly_contribution`
- `interest_type`: `none`, `simple`, `compound`
- `interest_rate`
- `interest_period`: `monthly`, `yearly`
- `start_month`
- `end_month`
- `active`

### Projecao do cofrinho (`SavingsProjectionPoint`)

Campos:

- `month_key`
- `month_label`
- `invested_amount`
- `interest_amount`
- `projected_balance`
- `monthly_contribution`
- `accumulated_contributions`
- `accumulated_interest`

### Dashboard do cofrinho (`SavingsDashboard`)

Campos:

- `total_invested_now`
- `projected_balance`
- `total_monthly_contribution`
- `projected_interest`
- `investments_count`
- `best_projection`
- `projection`
- `investments`

### WhatsApp (`WhatsAppAccount`)

Campos:

- `id`
- `user_id`
- `phone_number`: formato `whatsapp:+55...`
- `provider`: `twilio`
- `provider_identity`
- `active`
- `created_at`
- `updated_at`

### Billing

`BillingPlan`:

- `id`
- `code`
- `name`
- `description`
- `price_cents`
- `currency`
- `billing_interval`
- `features`

`BillingPayment`:

- `id`
- `user_id`
- `plan_id`
- `subscription_id`
- `provider`
- `provider_payment_id`
- `payment_method`
- `status`
- `amount_cents`
- `currency`
- `description`
- `qr_code`
- `qr_code_base64`
- `checkout_url`
- `external_reference`
- `sandbox`
- `paid_at`
- `expires_at`
- `created_at`

`BillingSubscription`:

- `id`
- `user_id`
- `plan_id`
- `status`
- `provider`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`

## Principais endpoints consumidos

Auth:

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-email-code`
- `POST /api/auth/login`
- `POST /api/auth/password-reset/start`
- `POST /api/auth/password-reset/confirm`
- `GET /api/auth/me`

Usuarios:

- `GET /api/users/{id}`
- `GET /api/users/lookup?email=...`
- `POST /api/users`
- `PUT /api/users/{id}`
- `GET /api/health`

Categorias:

- `GET /api/categories?type=income|expense`

Fluxo/Budgets:

- `GET /api/budgets?user_id={id}`
- `POST /api/budgets`
- `PUT /api/budgets/{id}`
- `DELETE /api/budgets/{id}`

Transacoes:

- `GET /api/transactions?user_id={id}&month_key=YYYY-MM`
- `POST /api/transactions`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`

Contas:

- `GET /api/bills?user_id={id}&month_key=YYYY-MM`
- `POST /api/bills/{budget_id}/pay`
- `POST /api/bills/{budget_id}/unpay`
- `POST /api/bills/{budget_id}/receive`
- `POST /api/bills/{budget_id}/unreceive`

Dashboard:

- `GET /api/dashboard?user_id={id}&month_key=YYYY-MM`
- `GET /api/projections/balance?user_id={id}&months=12`

Cofrinho:

- `GET /api/savings/dashboard?user_id={id}&months=12`
- `GET /api/savings/investments?user_id={id}`
- `POST /api/savings/investments`
- `PUT /api/savings/investments/{id}`
- `DELETE /api/savings/investments/{id}`
- `GET /api/savings/projection?user_id={id}&months=12`

WhatsApp:

- `GET /api/integrations/whatsapp/accounts?user_id={id}`
- `POST /api/integrations/whatsapp/accounts`
- `DELETE /api/integrations/whatsapp/accounts/{id}`
- `POST /api/integrations/whatsapp/twilio/webhook`

Billing:

- `GET /api/billing/plans`
- `GET /api/billing/config`
- `GET /api/billing/me?user_id={id}`
- `POST /api/billing/checkout/pix`
- `POST /api/billing/checkout/card`
- `GET /api/billing/payments/{payment_id}?user_id={id}`

## Comportamentos globais

- A sessao fica em `localStorage` na chave `dincon.auth.session`.
- O token JWT e enviado como `Authorization: Bearer`.
- `FinanceShell` controla o mes atual com `useMonth`.
- O mes e mostrado como `YYYY-MM` no topo.
- Toast global mostra mensagens de sucesso.
- O menu mobile so mostra icones.
- Acoes de linha usam tres pontos em alguns modulos.
- FAB aparece em Fluxo de caixa, Transacoes e Cofrinho.
- Tema visual atual e dark premium com classes CSS `cf-*`.

## Pontos de friccao observados

- Existem conceitos parecidos:
  - Budget
  - Fluxo de caixa
  - Conta
  - Transacao
  - Lancamento
  - Entrada prevista
  - Entrada recebida
- A rota interna ainda e `/planejamento`, mas a tela se chama "Fluxo de caixa".
- O menu tem "Contas" e "Fluxo de caixa"; ambos manipulam contas pagas/pendentes.
- `email_verified` representa verificacao por SMS/celular, o nome tecnico pode confundir.
- O dashboard mistura previsto, realizado e projetado.
- Alguns textos estao sem acento ou com encoding quebrado.
- O componente `Card` e usado para quase tudo, o que pode reduzir hierarquia visual.
- Filtros e status nao seguem um padrao unico entre telas.
- A tela de Fluxo de caixa tem muitas responsabilidades:
  - previsao de entradas
  - contas fixas
  - transacoes variaveis
  - status de pagamento
  - dashboard informativo
  - criacao de entrada
  - criacao de transacao

## Perguntas recomendadas para a reestruturacao

1. Qual deve ser a diferenca visual clara entre "previsto" e "realizado"?
2. "Contas" deve continuar como tela separada ou virar uma aba dentro de Fluxo de caixa?
3. "Nova entrada" deveria se chamar "Nova receita prevista"?
4. "Nova transacao" deveria se chamar "Novo lancamento realizado"?
5. O usuario precisa ver primeiro saldo, status de contas ou lista de acoes?
6. O mes `YYYY-MM` deveria ser apresentado como `Junho/2026`?
7. Status deveriam ter cores fixas e legenda persistente?
8. Cofrinho deveria ficar isolado do fluxo financeiro mensal?
9. Perfil deveria separar "Dados pessoais", "Seguranca" e "Integracoes"?
10. Dashboard deve priorizar entendimento rapido ou detalhes operacionais?
