## Parent PRD

[../PRD.md](../PRD.md)

## What to build

End-to-end implementation of per-category, per-month spending limits and the category spending table in the monthly view. This slice delivers the `category_limits` schema, tRPC procedures for setting and reading limits, and the UI table that shows each category's limit, amount spent, and percentage used.

Each category can have a different limit for each month/year combination. Changing a limit for one month must never affect other months. If no limit is set for a category in a given month, it is displayed without a limit (no percentage calculation).

The spending total per category is computed by summing all `expense_entries` for that profile + category + month.

## Acceptance criteria

- [ ] Monthly view includes a category spending table below the expense list
- [ ] Table shows each category with: amount spent, limit (if set), and percentage of limit used
- [ ] Users can set or update a spending limit for a category for the current month directly from the table
- [ ] Changing the limit for one month does not affect limits in other months
- [ ] Categories with no limit set show only the amount spent (no percentage)
- [ ] Percentage bar or indicator turns visually distinct (e.g., red) when spending exceeds 100% of the limit
- [ ] Spending totals update in real-time as expenses are added or removed
- [ ] All monetary values stored as integers (centavos) and displayed as formatted BRL currency

## Blocked by

- Blocked by `03-category-and-credit-card-management.md`
- Blocked by `05-one-off-expenses.md`

## User stories addressed

- User story 38
- User story 39
- User story 40
- User story 59
