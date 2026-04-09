# Loop Progress

## Loop 1 — Issues 02–12: All Issues Completed

### Resumo das issues implementadas

| Issue | Descrição | Tests adicionados | Commit |
|-------|-----------|-------------------|--------|
| 02 | Profile Management | 6 | de8b8d2 |
| 03 | Category & Credit Card Management | 9 | ef3ceeb |
| 04 | One-off Income | 5 | e76c19b |
| 05 | One-off Expenses | 6 | 615c02d |
| 06 | Category Monthly Limits | 5 | 5840506 |
| 07 | Recurring Templates | 9 | 9c6bb65 |
| 08 | Auto-Launch Service | 6 | 4f8b4b9 |
| 09 | Installments | 5 | 0632a64 |
| 10 | Investment Goals & Contributions | 6 | 5ca2e7e |
| 11 | Monthly Dashboard & Charts | 5 | 7ee72fa |
| 12 | Annual Overview | 4 | d8082e2 |

**Total: 79 testes passando, 13 arquivos de teste**

### Tabelas criadas no banco de dados
- `profiles` — perfis de usuário com tema
- `categories` — categorias por perfil (10 pré-definidas)
- `credit_cards` — cartões por perfil
- `recurring_income` — templates de receita recorrente
- `fixed_expenses` — templates de despesa fixa
- `income_entries` — receitas mensais (com recurringIncomeId)
- `expense_entries` — despesas mensais (com fixedExpenseId, installment_*)
- `month_initializations` — controle de auto-launch por mês
- `category_limits` — limites mensais por categoria
- `installment_groups` — grupos de compras parceladas
- `investment_goals` — metas de investimento
- `investment_contributions` — aportes por meta

### Routers tRPC implementados
- `health` — ping
- `profile` — list, create, rename, delete, setTheme
- `category` — list, create, rename, delete
- `creditCard` — list, create, rename, delete
- `recurringIncome` — list, create, update, deactivate, delete
- `fixedExpense` — list, create, update, deactivate, delete
- `income` — list, create, update, delete
- `expense` — list, create, update, delete
- `autoLaunch` — initMonth (idempotente)
- `categoryLimit` — getMonthLimits, setLimit, getCategorySpending
- `installment` — create (N parcelas), cancelFrom
- `investment` — listGoals, createGoal, archiveGoal, getGoalTotals, addContribution, updateContribution, deleteContribution, listContributions
- `dashboard` — monthly (agregação para dashboard)
- `annualOverview` — yearly (agregação anual completa)

### Páginas UI implementadas
- `ProfileSelectPage` — seleção/criação/renomear/excluir perfis (estilo Netflix)
- `Home` — layout com navegação (Mensal | Dashboard | Anual | Investimentos | Configurações)
- `MonthlyView` — receitas + despesas do mês, navegação, parcelamento, tabela de categorias
- `Dashboard` — 4 gráficos (% renda gasta, por forma de pagamento, por categoria, aportes)
- `AnnualOverview` — visão anual com tabela mensal, gráficos, estatísticas
- `InvestmentsPage` — metas de investimento com progress bar e aportes
- `SettingsPage` — categorias, cartões, entradas recorrentes, despesas fixas

### O que falta fazer
- Nenhuma issue pendente (02-12 concluídas)
