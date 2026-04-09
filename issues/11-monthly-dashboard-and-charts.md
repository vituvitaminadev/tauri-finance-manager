## Parent PRD

[../PRD.md](../PRD.md)

## What to build

The complete monthly dashboard view with summary cards and all four charts. This slice delivers the `dashboard.monthly` tRPC aggregation query and the full dashboard UI for the selected month.

The dashboard aggregates data already stored by slices 04–10 and presents:
- **Summary cards**: total income, total expenses, net balance (income − expenses)
- **Chart 1**: Pie — percentage of total income already spent (expenses / income × 100)
- **Chart 2**: Pie — percentage of total expenses by payment method (debit, PIX, boleto, cash, credit)
- **Chart 3**: Pie — percentage of total expenses by category
- **Chart 4**: Bar or summary — total investment contributions for the selected month, broken down by goal

No new data entry is introduced in this slice — it is purely aggregation and visualization.

## Acceptance criteria

- [ ] Monthly view shows summary cards: total income, total expenses, net balance for the selected month
- [ ] Chart 1 (pie) shows % of income spent; handles the edge case where income is zero (show 0% or "no income")
- [ ] Chart 2 (pie) shows % of expenses per payment method; only methods with non-zero spending appear
- [ ] Chart 3 (pie) shows % of expenses per category; only categories with non-zero spending appear
- [ ] Chart 4 shows investment contributions for the month per goal
- [ ] All charts update when the selected month changes
- [ ] All charts update immediately when income/expense/investment data changes (via TanStack Query invalidation)
- [ ] Charts render correctly with zero data (empty state, not broken)
- [ ] All monetary values displayed as formatted BRL currency
- [ ] Charts use shadcn/ui chart components (Recharts-based)

## Blocked by

- Blocked by `04-one-off-income.md`
- Blocked by `05-one-off-expenses.md`
- Blocked by `06-category-monthly-limits.md`
- Blocked by `08-auto-launch-service.md`
- Blocked by `09-installments.md`
- Blocked by `10-investment-goals-and-contributions.md`

## User stories addressed

- User story 54
- User story 55
- User story 56
- User story 57
- User story 58
