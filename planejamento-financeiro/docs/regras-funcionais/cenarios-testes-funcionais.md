# Cenários de Testes Funcionais - Contas, Budgets e Lançamentos

## 1. Objetivo

Este documento lista cenários de testes funcionais derivados da análise do projeto DinCon, cobrindo:

- `budgets`
- `transactions`
- `kind`
- `budget_type`
- contas pendentes
- fluxo de caixa
- dashboard
- exclusões

Os cenários estão separados em:

- casos esperados como aprovados
- casos que hoje devem falhar por inconsistência conhecida
- casos de regressão recomendados

## 2. Premissas de teste

- Usuário autenticado.
- Base com categorias de `income` e `expense`.
- Mês de referência selecionado na interface.
- APIs e frontend no estado atual do projeto.

## 3. Cenários esperados como aprovados

| ID | Cenario | Precondicao | Passos | Resultado esperado | Tela/Painel |
|---|---|---|---|---|---|
| TF-01 | Criar receita prevista recorrente | Usuario autenticado | Abrir Fluxo de Caixa e salvar budget com `kind = income`, `budget_type = fixed`, categoria de income e valor valido | Budget salvo como receita prevista recorrente | Fluxo de Caixa |
| TF-02 | Criar despesa fixa recorrente com vencimento | Usuario autenticado | Abrir Fluxo de Caixa e salvar budget com `kind = expense`, `budget_type = fixed`, `has_due_date = true`, `due_day` valido | Budget salvo como conta fixa recorrente | Fluxo de Caixa |
| TF-03 | Criar lançamento avulso de entrada | Usuario autenticado | Abrir Lançamentos e salvar transaction com `kind = income`, `budget_id = null`, status `paid` | Transaction salva como lançamento avulso de entrada | Lançamentos |
| TF-04 | Criar lançamento avulso de saída | Usuario autenticado | Abrir Lançamentos e salvar transaction com `kind = expense`, `budget_id = null`, categoria obrigatória, status `paid` | Transaction salva como lançamento avulso de saída | Lançamentos |
| TF-05 | Pagar conta fixa do mês | Existe budget `expense/fixed/has_due_date` ativo no mês | Abrir Contas e marcar como paga | Sistema cria transaction paga vinculada ao budget e a conta sai de pendente | Contas |
| TF-06 | Desfazer pagamento de conta fixa | Existe conta marcada como paga no mês | Abrir Contas e voltar para pendente | Transaction paga do budget/mes é removida | Contas |
| TF-07 | Receber receita prevista | Existe budget `income` ativo no mês | Abrir Fluxo de Caixa e marcar como recebida | Sistema cria transaction paga de income vinculada ao budget | Fluxo de Caixa |
| TF-08 | Desfazer recebimento de receita | Existe receita prevista marcada como recebida | Abrir Fluxo de Caixa e voltar para previsto | Transaction paga do budget/mes é removida | Fluxo de Caixa |
| TF-09 | Exibir entradas realizadas no dashboard | Existem transactions `paid` de `income` no mês | Abrir Dashboard | KPI de entradas mostra a soma correta | Dashboard |
| TF-10 | Exibir gastos realizados no dashboard | Existem transactions `paid` de `expense` no mês | Abrir Dashboard | KPI de gastos mostra a soma correta | Dashboard |
| TF-11 | Exibir contas pendentes do mês | Existem budgets `expense/fixed/has_due_date` sem transaction paga | Abrir Contas | Budget aparece em "Contas a pagar" | Contas |
| TF-12 | Excluir budget com transactions vinculadas | Budget com transactions vinculadas existe | Excluir budget | Transactions vinculadas também são removidas | Fluxo de Caixa / Lançamentos |
| TF-13 | Excluir última transaction vinculada ao budget | Budget com uma única transaction existe | Excluir transaction | Budget também é removido | Lançamentos / Fluxo de Caixa |

## 4. Cenários que hoje devem falhar ou estão inconsistentes

| ID | Cenario | Precondicao | Passos | Resultado observado hoje | Tela/Painel |
|---|---|---|---|---|---|
| TF-F01 | Conta fixa com recorrência variável | Usuario autenticado | Abrir Fluxo de Caixa e criar item com intenção de conta fixa, selecionando recorrência `Variável` | Budget salva como `budget_type = variable` com rótulo de despesa programada | Fluxo de Caixa |
| TF-F02 | Transaction ligada a budget variável tratada como avulsa | Existe transaction com `budget_id` apontando para budget `variable` | Abrir Fluxo de Caixa | Frontend pode classificar como avulsa, embora não seja `budget_id = null` | Fluxo de Caixa |
| TF-F03 | Budget variável aparecer como conta do mês | Existe budget `expense/variable` | Abrir Contas | Budget não aparece em pendentes/pagas | Contas |
| TF-F04 | Ver projeção do saldo no dashboard | Usuário com dashboard carregado | Abrir Dashboard | Projection é buscada, mas não é exibida | Dashboard |
| TF-F05 | Ver cancelados no fluxo de caixa | Existem transactions `canceled` no mês | Abrir Fluxo de Caixa | Cancelados aparecem na lista de avulsos com status próprio | Fluxo de Caixa |
| TF-F06 | Regra de vencimento consistente entre front e backend | Budget com `due_day > 28` | Comparar status no front e no backend | Pode haver divergência no cálculo da data | Fluxo de Caixa / Contas |
| TF-F07 | Criar budget sem categoria | Banco aceita nullable, mas API exige valor | Tentar salvar budget sem categoria | API retorna erro e não salva | Fluxo de Caixa |
| TF-F08 | Usar "conta fixa" e "variável" na mesma UX sem ambiguidade | Tela de budget aberta | Tentar salvar como conta fixa com recorrência variável | UX fica semanticamente alinhada com a nomenclatura atual | Fluxo de Caixa |

## 5. Cenários de regressão recomendados

| ID | Cenario | Objetivo | Tela/Painel |
|---|---|---|---|
| TR-01 | Criar budget income fixed e depois recebê-lo | Garantir que a conversão de previsão para realizado não duplica valor | Fluxo de Caixa / Dashboard |
| TR-02 | Criar budget expense fixed e pagá-lo e depois desfazer | Garantir que `pay/unpay` alterna corretamente `pending` e `paid` | Contas |
| TR-03 | Criar transaction avulsa, alterar para canceled e voltar | Garantir consistência de status visual e filtragem | Lançamentos / Fluxo de Caixa |
| TR-04 | Remover transaction vinculada e verificar exclusão do budget quando último vínculo | Garantir limpeza bidirecional atual | Lançamentos / Fluxo de Caixa |
| TR-05 | Comparar o mesmo mês no passado, atual e futuro | Garantir troca entre realizado e previsto no dashboard | Dashboard |

## 6. Notas de interpretação

- `Conta fixa` no uso do sistema é um rótulo funcional de UX, não um enum isolado.
- `Variável` corresponde a `budget_type = variable`.
- `Programada` é o rótulo visual usado para itens variáveis no fluxo de caixa.
- `Avulso` hoje é tratado de forma diferente no backend e no frontend.
- `Contas do mês` só considera despesas fixas com vencimento e vínculo ativo no mês.

## 7. Matriz de classificacao `kind` x `budget_type`

| ID | Classificacao | Regra | Resultado esperado | Tela/Painel |
|---|---|---|---|---|
| MC-01 | `income + fixed` | Budget de entrada recorrente | Aparece como receita prevista recorrente; ao ser recebido, gera transaction paga vinculada | Fluxo de Caixa / Dashboard |
| MC-02 | `income + variable` | Budget de entrada programada | Aparece como receita prevista programada; não entra em contas do mês | Fluxo de Caixa / Dashboard |
| MC-03 | `expense + fixed` | Budget de saída recorrente | Aparece como conta fixa e pode entrar em pendentes/pagas se tiver vencimento | Fluxo de Caixa / Contas / Dashboard |
| MC-04 | `expense + variable` | Budget de saída programada | Aparece como gasto variável previsto no dashboard; não deve se comportar como conta do mês | Dashboard / Fluxo de Caixa |
| MC-05 | `income + NULL budget_id` | Transaction avulsa de entrada | Aparece em lançamentos e no fluxo como avulsa | Lançamentos / Fluxo de Caixa |
| MC-06 | `expense + NULL budget_id` | Transaction avulsa de saída | Aparece em lançamentos e no fluxo como avulsa | Lançamentos / Fluxo de Caixa |

## 8. Regras por tela/painel

### 8.1 Dashboard

| ID | Cenario | Regra validada | Resultado esperado | Status atual |
|---|---|---|---|---|
| DS-01 | Entradas realizadas | Somente `transactions.paid` de `income` entram em `total_income` | KPI calcula apenas entradas pagas | Deve aprovar |
| DS-02 | Gastos realizados | Somente `transactions.paid` de `expense` entram em `total_expense` | KPI calcula apenas gastos pagos | Deve aprovar |
| DS-03 | Economia | `total_income - total_expense` | Economia correta | Deve aprovar |
| DS-04 | Saldo acumulado | Soma da economia desde `base_month` sobre `initial_balance` | Saldo acumulado correto | Deve aprovar |
| DS-05 | Ganhos | Mostra budgets `income` ativos no mês | Lista ganhos previstos | Deve aprovar |
| DS-06 | Gastos fixos | Mostra budgets `expense/fixed` ativos no mês | Lista gastos fixos previstos | Deve aprovar |
| DS-07 | Gastos variáveis | Mostra budgets `expense/variable` e avulsos compatíveis com a regra do painel | Lista gastos variáveis | Deve aprovar com ressalva de regra atual |
| DS-08 | Contas do mês | Só mostra budgets pagáveis | Lista pendentes/pagas | Deve aprovar |
| DS-09 | Para onde foi o dinheiro | Só soma `expense` pago por categoria | Gráfico por categoria | Deve aprovar |
| DS-F10 | Projeção não exibida | Projection é carregada, mas não renderizada | Falha conhecida | Falha conhecida |

### 8.2 Fluxo de Caixa

| ID | Cenario | Regra validada | Resultado esperado | Status atual |
|---|---|---|---|---|
| FC-01 | Receita prevista | `kind = income` e budget ativo no mês | Aparece em Receitas previstas | Deve aprovar |
| FC-02 | Conta fixa | `kind = expense` e `budget_type = fixed` | Aparece em Contas fixas | Deve aprovar |
| FC-03 | Lançamento avulso | `budget_id = null` ou classificação frontend sem budget fixo | Aparece em Lançamentos avulsos | Deve aprovar com ressalva de divergência |
| FC-04 | Pago/recebido | `status = paid` | Status muda para Pago/Recebido | Deve aprovar |
| FC-F05 | Variável não aparece como conta do mês | `expense/variable` não é pagável | Não deve entrar em Contas fixas | Falha conhecida se a expectativa for outra |
| FC-F06 | Cancelado | `status = canceled` | Aparece na lista do fluxo de caixa com status próprio | Deve aprovar |

### 8.3 Lançamentos

| ID | Cenario | Regra validada | Resultado esperado | Status atual |
|---|---|---|---|---|
| LT-01 | Lista geral | Mostra todas as transactions do mês | Exibe lançamentos do período | Deve aprovar |
| LT-02 | Filtro por tipo | `kind = income` ou `expense` | Lista filtrada corretamente | Deve aprovar |
| LT-03 | Filtro por categoria | `category_id` | Lista filtrada corretamente | Deve aprovar |
| LT-04 | Badge de origem | `is_fixed_bill`, `budget_id`, `kind` | Badge correto de origem | Deve aprovar |
| LT-F05 | Cancelado | `status = canceled` | Continua aparecendo na tela de lançamentos | Deve aprovar |
| LT-F06 | Receita prevista | `budget_id` preenchido e `kind = income` | Badge de receita prevista | Deve aprovar |

### 8.4 Contas

| ID | Cenario | Regra validada | Resultado esperado | Status atual |
|---|---|---|---|---|
| CT-01 | Contas pendentes | `expense + fixed + has_due_date + ativo no mês + sem paid` | Aparece em Contas a pagar | Deve aprovar |
| CT-02 | Contas pagas | Mesmo budget com transaction paga | Move para Contas pagas | Deve aprovar |
| CT-03 | Fora da vigência | Budget fora de `start_month/end_month` | Não aparece | Deve aprovar |
| CT-F04 | Variável como pendente | `expense/variable` | Não aparece em Contas | Falha conhecida se a expectativa for exibir |
| CT-F05 | Conta sem vencimento | `has_due_date = false` | Não aparece como pendente | Falha conhecida se a UX sugerir o contrário |

### 8.5 Perfil / Assinatura / WhatsApp

| ID | Cenario | Regra validada | Resultado esperado | Tela/Painel |
|---|---|---|---|---|
| PB-01 | Plano gratuito | `plan.code = free` | Não gera cobrança | Minha Assinatura / Checkout |
| PB-02 | Plano WhatsApp | `plan.code = pro` | Libera WhatsApp e cadastro de números | Minha Assinatura / Perfil |
| PB-03 | Pix ativo | `payment_method = pix` e status pendente | QR code e expiração aparecem | Checkout |
| PB-04 | Pix expirado | `status = expired` | Exibe expiração e bloqueia pagamento | Checkout |
| PB-05 | Status de cobrança traduzido | `approved/pending/failed/...` | Label em PT-BR correto | Checkout / Minha Assinatura |
| WH-01 | Entrada WhatsApp | `direction = inbound` | Mensagem de entrada registrada | Perfil |
| WH-02 | Rascunho pendente | `status = pending_confirmation` | Aparece como pendente de confirmação | Perfil |
| WH-03 | Rascunho confirmado | `status = confirmed` | Cria transaction vinculada | Perfil |
| WH-04 | Canal de verificação | `channel = email|whatsapp|sms` | Status/canal exibido corretamente | Perfil |

## 9. Cenários de dados e validações técnicas

| ID | Cenario | Regra validada | Resultado esperado |
|---|---|---|---|
| DT-01 | `category_id` ausente em budget | API exige categoria para budget | Erro de validação |
| DT-02 | `category_id` ausente em expense transaction | API exige categoria para gasto | Erro de validação |
| DT-03 | `budget_id` incompatível com `kind` | Transaction deve ter budget do mesmo tipo | Erro de validação |
| DT-04 | `budget_id` vinculado a outro usuário | Restrição de ownership | Erro de acesso/validação |
| DT-05 | Budget fixo com `end_month` preenchido | Backend zera `end_month` | Salvar com `end_month = null` |
| DT-06 | `due_day` sem `has_due_date` | Campo é opcional quando não há vencimento | Salva sem vencimento |
| DT-07 | `due_day` com `has_due_date = true` | Campo obrigatório | Erro de validação se ausente |

## 10. Cenários para divergências conhecidas

| ID | Cenario | Divergencia esperada hoje | Onde verificar |
|---|---|---|---|
| DV-01 | Avulso no frontend x backend | Frontend considera "não fixed"; backend considera "sem budget" | Fluxo de Caixa / Dashboard |
| DV-02 | Vencimento acima de 28 | Frontend e backend calculam limites diferentes | Fluxo de Caixa / Contas |
| DV-03 | `canceled` entre telas | Lançamentos mostra; Fluxo de Caixa também mostra | Lançamentos / Fluxo de Caixa |
| DV-04 | Projection carregada e não exibida | Hook busca dados mas tela não renderiza gráfico | Dashboard |
| DV-05 | Conta fixa com recorrência variável | UX permite salvar combinação semanticamente alinhada com a nomenclatura atual | Fluxo de Caixa |

## 11. Critérios de aceite

- Regra clara entre `kind`, `budget_type`, `status` e `budget_id`.
- Contas pendentes só aparecem quando existem budgets pagáveis válidos.
- Lançamentos avulsos não dependem de budget fixo.
- Dashboard exibe somente o que a regra consolidada permite.
- Cobrança e WhatsApp usam os rótulos PT-BR corretos.
- Divergências conhecidas permanecem documentadas até decisão de produto.
