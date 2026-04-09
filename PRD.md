# PRD — Finance Manager Dashboard

## Problem Statement

Managing personal finances through a spreadsheet is functional but limited: it requires manual effort every month, lacks interactivity, doesn't support multiple user profiles on the same device, and is difficult to share with a partner. The user needs a desktop application that replicates and improves upon all the capabilities of their existing financial control spreadsheet, with a modern UI, automatic recurring entries, installment tracking, and investment goal management — accessible offline on any computer.

## Solution

A cross-platform desktop application built with Tauri, providing a local-first financial dashboard. The app supports multiple user profiles on the same installation (no passwords — profile selection at launch), with data isolated per profile in a local SQLite database. It offers two main views: a **monthly view** for day-to-day financial tracking and a **annual overview** for historical analysis. All data entry is done through the app, replacing the spreadsheet entirely.

## User Stories

### Profile Management
1. As a user, I want to create a named profile so that my financial data is isolated from other users on the same device.
2. As a user, I want to see all available profiles on a selection screen when I open the app, so that I can choose who I am without entering a password.
3. As a user, I want to select my profile from a Netflix-style card interface, so that switching users is intuitive and fast.
4. As a user, I want to switch between profiles from a switcher in the app header, so that I don't need to restart the app to change users.
5. As a user, I want my dark/light theme preference to be saved per profile, so that each user has their own visual experience.
6. As a user, I want to delete a profile and all its associated data, so that I can clean up unused profiles.
7. As a user, I want to rename my profile, so that it always reflects my preferred name.

### Theme
8. As a user, I want to toggle between dark mode and light mode, so that I can choose the visual experience that suits me.
9. As a user, I want my theme preference to persist across app restarts, so that I don't need to re-select it every time.

### Income (Entradas)
10. As a user, I want to register an income entry with a name and value, so that I can track money received in a given month.
11. As a user, I want to mark an income entry as recurring, so that it is automatically created on the same profile every month without manual input.
12. As a user, I want to edit a recurring income entry's value for a specific month, so that I can handle months where the amount differs (e.g., variable salary).
13. As a user, I want to delete a single monthly occurrence of a recurring income without affecting future months, so that I can handle exceptional months.
14. As a user, I want to delete the recurring income entirely, so that future months stop receiving it.
15. As a user, I want to see all income entries for the currently selected month, so that I have a clear picture of my receipts.

### Expenses (Saídas)
16. As a user, I want to register an expense with a name, value, payment method, and category, so that I can track where my money is going.
17. As a user, I want to select a payment method from: debit, PIX, boleto, cash, or credit card, so that I can categorize how the payment was made.
18. As a user, I want to select a named credit card when the payment method is credit, so that I can distinguish spending across multiple cards.
19. As a user, I want to assign a category to each expense (e.g., food, health, leisure), so that I can analyze my spending patterns.
20. As a user, I want to edit any expense entry, so that I can correct mistakes.
21. As a user, I want to delete any expense entry, so that I can remove erroneous records.
22. As a user, I want to see all expense entries for the currently selected month, so that I have a complete picture of my outgoings.

### Fixed Expenses (Despesas Fixas)
23. As a user, I want to register a fixed expense with a name, default value, payment method, and category, so that recurring bills are tracked without monthly re-entry.
24. As a user, I want fixed expenses to be automatically created as expense entries at the start of each new month, so that I don't need to manually add them.
25. As a user, I want to edit the value of a fixed expense in a specific month, so that I can handle months where the bill amount differs (e.g., variable electricity bill).
26. As a user, I want editing a fixed expense occurrence to not affect the default value or other months, so that historical records remain accurate.
27. As a user, I want to deactivate a fixed expense so that it stops auto-launching in future months without deleting the historical records.
28. As a user, I want to delete a fixed expense entirely, so that future months no longer receive it.

### Installments (Parcelamentos)
29. As a user, I want to register a credit card purchase as installments (e.g., 12x R$100), so that the app automatically creates one entry per month for the duration.
30. As a user, I want each installment entry to be labeled with its position (e.g., "Smart TV Samsung (3/12)"), so that I can easily track remaining installments.
31. As a user, I want to see only the current month's installment in the monthly view, so that the monthly total reflects actual cash flow.
32. As a user, I want to cancel remaining installments of a purchase, so that I can handle early payoffs or returns.
33. As a user, I want to edit the value of a specific installment occurrence, so that I can handle adjustments.

### Categories
34. As a user, I want a set of predefined categories to be available by default (e.g., Food, Health, Leisure, Transport, Housing, Education, Entertainment), so that I can start using the app immediately.
35. As a user, I want to create custom categories with a name, so that I can adapt the app to my personal spending habits.
36. As a user, I want to rename a custom category, so that I can keep my category names meaningful.
37. As a user, I want to delete a custom category, so that I can remove categories I no longer use.
38. As a user, I want to set a spending limit for a category for a specific month, so that I can budget for that period.
39. As a user, I want the app to show how much I've spent in a category versus its monthly limit (in value and percentage), so that I know when I'm approaching my budget.
40. As a user, I want the category limit for a month to remain unchanged when I update the limit for a future month, so that historical analysis stays accurate.

### Credit Cards
41. As a user, I want to register named credit cards on my profile (e.g., "Nubank", "Itaú"), so that I can distinguish credit card spending per card.
42. As a user, I want to edit the name of a credit card, so that I can keep it up to date.
43. As a user, I want to delete a credit card, so that it no longer appears as a payment method option.

### Investments
44. As a user, I want to create an investment goal with a name and an optional target amount, so that I can track progress toward a financial objective.
45. As a user, I want to create an investment goal without a target amount (e.g., emergency fund), so that I can track open-ended savings.
46. As a user, I want to register one or more contributions (aportes) to an investment goal in a given month, so that I can log variable or multiple deposits.
47. As a user, I want to see the total accumulated in an investment goal, so that I know how much I've saved overall.
48. As a user, I want to see the percentage progress toward the target amount of a goal, so that I know how close I am to achieving it.
49. As a user, I want to edit a contribution entry, so that I can correct mistakes.
50. As a user, I want to delete a contribution entry, so that I can remove erroneous records.
51. As a user, I want to archive an investment goal when it is completed or discontinued, so that it no longer clutters the active view.

### Monthly View
52. As a user, I want the app to open on the current month by default, so that I immediately see relevant data.
53. As a user, I want to navigate to previous or future months using a month/year selector, so that I can review or plan ahead.
54. As a user, I want to see a summary of total income, total expenses, and net balance for the selected month, so that I have a quick financial snapshot.
55. As a user, I want to see a pie chart showing what percentage of my total balance has been spent, so that I can gauge my financial health at a glance.
56. As a user, I want to see a pie chart showing the percentage distribution of my expenses by payment method (debit, PIX, boleto, cash, credit), so that I can understand how I'm paying for things.
57. As a user, I want to see a pie chart showing the percentage of my expenses per category, so that I can identify where most of my money goes.
58. As a user, I want to see a chart summarizing my investment contributions for the selected month, so that I can track investment activity.
59. As a user, I want to see the category spending table with the limit, amount spent, and percentage used for each category, so that I can monitor my budgets.

### Annual Overview
60. As a user, I want a dedicated annual overview screen, so that I can analyze my financial performance across the entire year.
61. As a user, I want to select which year to view in the annual overview, so that I can compare different years.
62. As a user, I want to see total income, total expenses, and net balance for the selected year, so that I have a macro picture of my finances.
63. As a user, I want to see income and expenses per month in a table with the monthly difference, so that I can identify patterns.
64. As a user, I want to see a line/bar chart showing income and expenses month by month for the year, so that I can visualize financial fluctuation over time.
65. As a user, I want to see which month had the highest spending and which had the lowest, so that I can identify outlier months.
66. As a user, I want to see which category accumulated the most spending across the year, so that I know my biggest expense driver.
67. As a user, I want to see a breakdown of total spending per category for the year, so that I can analyze annual budget allocation.
68. As a user, I want to see a line chart showing the accumulated investment value per goal over the year, so that I can track investment growth over time.

## Implementation Decisions

### Architecture
- **Desktop runtime**: Tauri 2.x (Rust shell + WebView frontend)
- **Frontend**: React + TypeScript + Vite
- **Routing**: TanStack Router (file-based routing)
- **Server state**: TanStack Query
- **Backend**: HonoJS running as a local HTTP server embedded in the Tauri process, exposed via `tauri-plugin-http` or sidecar
- **API layer**: tRPC over HonoJS for end-to-end type safety between frontend and backend
- **Database**: SQLite via `better-sqlite3` (Node sidecar) or `tauri-plugin-sql` (Rust-native)
- **ORM**: Drizzle ORM with SQLite dialect
- **UI components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Charts**: shadcn/ui chart components (built on Recharts)
- **Theme**: shadcn/ui dark/light mode, persisted per profile in the database

### Database Schema (key entities)
- **profiles**: id, name, theme_preference, created_at
- **credit_cards**: id, profile_id, name
- **categories**: id, profile_id, name, is_default
- **category_limits**: id, category_id, profile_id, year, month, limit_amount
- **income_entries**: id, profile_id, name, amount, year, month, recurring_group_id (nullable)
- **recurring_income**: id, profile_id, name, default_amount, is_active
- **expense_entries**: id, profile_id, name, amount, year, month, payment_method, credit_card_id (nullable), category_id, fixed_expense_id (nullable), installment_group_id (nullable), installment_index (nullable), installment_total (nullable)
- **fixed_expenses**: id, profile_id, name, default_amount, payment_method, credit_card_id (nullable), category_id, is_active
- **installment_groups**: id, profile_id, name, total_amount, installment_count, credit_card_id, category_id, start_year, start_month
- **investment_goals**: id, profile_id, name, target_amount (nullable), is_archived
- **investment_contributions**: id, goal_id, profile_id, amount, year, month, note (nullable)

### Module Breakdown

**Profile Module**
- List, create, update, delete profiles
- Store and retrieve theme preference per profile
- Profile context provided globally to all other modules

**Income Module**
- CRUD for one-off and recurring income entries
- Auto-launch service: on first access to a new month, checks for active recurring income and creates monthly entries if not already present
- Supports editing individual monthly occurrences without affecting the recurring template

**Expense Module**
- CRUD for expense entries
- Links to credit card, category, fixed expense template, or installment group via nullable foreign keys

**Fixed Expense Module**
- CRUD for fixed expense templates
- Auto-launch service (same trigger as recurring income): creates expense entries from active fixed templates for the accessed month if not already present
- Editing an occurrence updates only that month's entry, not the template

**Installment Module**
- On creation, generates N expense_entries (one per month) linked via installment_group_id
- Label format: `{name} ({index}/{total})`
- Supports cancelling remaining installments (delete future entries in the group)
- Supports editing individual installment values

**Category Module**
- Manages predefined (seeded) and user-created categories per profile
- Manages monthly limits (category_limits table keyed by category + profile + year + month)
- Computes spending totals per category for a given month by summing expense_entries

**Credit Card Module**
- CRUD for named credit cards per profile

**Investment Module**
- CRUD for investment goals (target_amount optional)
- CRUD for contributions per goal per month (multiple contributions per month allowed)
- Computes total accumulated and percentage toward target

**Monthly Dashboard Module**
- Aggregates income, expenses, investments for a given profile + year + month
- Computes: total income, total expenses, net balance
- Computes: % of balance spent, spending by payment method, spending by category
- Provides data for all monthly charts and the category limits table

**Annual Overview Module**
- Aggregates data for a given profile + year across all 12 months
- Computes: monthly income/expense/difference table, yearly totals, best/worst months, top category, per-category totals
- Aggregates investment contributions per goal per month for the investment line chart

**tRPC Router Module**
- Organizes all procedures under routers: `profile`, `income`, `expense`, `fixedExpense`, `installment`, `category`, `creditCard`, `investment`, `dashboard`, `annualOverview`
- All procedures are type-safe end-to-end via tRPC + Zod input validation

**Auto-Launch Service**
- A background service (triggered on month navigation) that:
  1. Checks whether the target month has been "initialized" for the profile
  2. Creates recurring income entries from active templates
  3. Creates fixed expense entries from active templates
  4. Marks the month as initialized to prevent duplicate launches

### API Contracts (tRPC procedures, selected examples)
- `profile.list()` → Profile[]
- `profile.create({ name })` → Profile
- `income.listByMonth({ profileId, year, month })` → IncomeEntry[]
- `expense.listByMonth({ profileId, year, month })` → ExpenseEntry[]
- `expense.create({ profileId, name, amount, year, month, paymentMethod, creditCardId?, categoryId })` → ExpenseEntry
- `installment.create({ profileId, name, totalAmount, count, creditCardId, categoryId, startYear, startMonth })` → InstallmentGroup
- `category.listWithSpending({ profileId, year, month })` → CategoryWithSpending[]
- `investment.listGoals({ profileId })` → InvestmentGoal[]
- `investment.addContribution({ goalId, profileId, amount, year, month, note? })` → Contribution
- `dashboard.monthly({ profileId, year, month })` → MonthlyDashboard
- `annualOverview.yearly({ profileId, year })` → AnnualOverview

## Testing Decisions

### What makes a good test
- Tests verify **external behavior** (what the module returns or does), not implementation details (how it does it).
- Tests use a real in-memory SQLite database (not mocks) to ensure SQL logic is correct.
- Each test sets up its own isolated data and tears down after.

### Modules to test
- **Auto-Launch Service** — verify that recurring income and fixed expenses are created exactly once per month, that editing an occurrence doesn't affect the template, and that deactivated templates are not launched.
- **Installment Module** — verify that N entries are created correctly, labels are formatted as `(n/total)`, cancellation removes only future entries, and editing one occurrence doesn't affect others.
- **Category Module** — verify spending totals are correctly summed per category per month, and that monthly limits are independent per month (changing one month doesn't affect others).
- **Annual Overview Module** — verify totals, best/worst month calculations, and per-category annual aggregation across all 12 months.
- **Investment Module** — verify accumulated total and percentage calculations with multiple contributions across multiple months.
- **tRPC Routers** — integration tests calling the actual tRPC procedures against a test SQLite database to verify end-to-end behavior.

## Out of Scope

- **Credit card billing cycle / invoice closing date** — expenses are recorded in the month they occur; no invoice tracking.
- **Data import from Excel/spreadsheet** — users start fresh; historical data remains in the original spreadsheet.
- **Cloud sync or remote backup** — all data is local to the device; no sync between devices.
- **Push notifications or reminders** — no alerts for approaching category limits or upcoming bills.
- **Multi-currency support** — all values are in BRL.
- **Bank/Open Finance integration** — no automatic import of transactions.
- **Receipt scanning or OCR** — all data entry is manual.
- **Reporting export (PDF/Excel)** — no export functionality.
- **Admin impersonation** — not applicable in the local multi-profile model.

## Further Notes

- The app is intended for use by two people (a couple) each on their own computer, with separate profile installations. Data is not shared between devices.
- The predefined category list should be seeded on first launch and include at minimum: Food, Health, Leisure, Transport, Housing, Education, Entertainment, Clothing, Subscriptions, Other.
- The "month initialization" mechanism for auto-launching recurring entries must be idempotent — running it multiple times for the same month must not create duplicate entries.
- Drizzle ORM migrations should be run automatically on app startup to keep the schema up to date across versions.
- All monetary values should be stored as integers (centavos) in the database to avoid floating-point precision issues, and formatted as BRL currency in the UI.
