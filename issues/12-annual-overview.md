## Parent PRD

[../PRD.md](../PRD.md)

## What to build

The annual overview screen that aggregates financial data across all 12 months of a selected year. This slice delivers the `annualOverview.yearly` tRPC aggregation query and the full annual overview UI.

The screen provides a macro view of the user's finances for a full year, with:
- A year selector to navigate between years
- A monthly breakdown table (income, expenses, difference per month)
- A dual-axis line/bar chart showing income and expenses month by month
- Key statistics: total income, total expenses, net balance, month with highest spending, month with lowest spending, category with most total spending
- A per-category spending breakdown for the full year
- A line chart showing investment contribution totals per goal over the 12 months

Months with no data appear in the table as zeros (not omitted).

Tests must use a real in-memory SQLite database (no mocks).

## Acceptance criteria

- [ ] A dedicated Annual Overview route/page is accessible from the app navigation
- [ ] Year selector allows navigating to any year that has data, plus the current year
- [ ] Monthly table shows income, expenses, and difference (income − expenses) for each of the 12 months; months with no data show zero
- [ ] Dual-axis line/bar chart visualizes income and expenses across the 12 months
- [ ] Summary stats show: total annual income, total annual expenses, net annual balance
- [ ] Summary stats show: the month with highest expenses and the month with lowest expenses (by name, e.g., "March")
- [ ] Summary stats show: the category with the highest total spending for the year
- [ ] Per-category table shows total spending in each category across all 12 months
- [ ] Investment line chart shows cumulative or monthly contribution per goal across the 12 months
- [ ] All charts and tables update when the year selector changes
- [ ] All monetary values displayed as formatted BRL currency
- [ ] **Test**: yearly totals equal the sum of all 12 monthly totals
- [ ] **Test**: best/worst month calculation is correct with ties handled gracefully
- [ ] **Test**: top category is correctly identified when multiple categories have large totals

## Blocked by

- Blocked by `11-monthly-dashboard-and-charts.md`

## User stories addressed

- User story 60
- User story 61
- User story 62
- User story 63
- User story 64
- User story 65
- User story 66
- User story 67
- User story 68
