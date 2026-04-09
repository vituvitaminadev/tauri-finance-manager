## Parent PRD

[../PRD.md](../PRD.md)

## What to build

The month initialization service that automatically creates monthly entries from active templates when a user navigates to a month for the first time. This slice delivers the `month_initializations` schema, the auto-launch logic, and integration of the service into the month navigation flow.

When a user navigates to a month (including the current month on first open), the service checks whether that profile + year + month combination has already been initialized. If not, it:
1. Creates one `income_entry` for each active `recurring_income` template
2. Creates one `expense_entry` for each active `fixed_expenses` template (using the template's default amount, payment method, and category)
3. Records the month as initialized to prevent duplicate launches

Users can then edit the value of any auto-launched entry for that month without affecting the template or other months. Auto-launched entries are visually distinguishable from manually-created ones (e.g., a badge or icon).

The service must be **idempotent**: calling it multiple times for the same month must never create duplicate entries.

Tests for this slice must use a real in-memory SQLite database (no mocks).

## Acceptance criteria

- [ ] Navigating to any month triggers the initialization check for the active profile
- [ ] If the month is uninitialized, income entries are created from all active recurring income templates
- [ ] If the month is uninitialized, expense entries are created from all active fixed expense templates using their default values
- [ ] The month is marked as initialized after the first run; subsequent navigations to the same month do not create duplicate entries
- [ ] Deactivated templates are not launched (neither income nor expense)
- [ ] Auto-launched entries are visually distinguishable in the monthly view (badge/icon)
- [ ] Editing an auto-launched entry's value for a specific month does not change the template's default amount or any other month's entry
- [ ] Deleting an auto-launched entry for a specific month does not affect the template or other months
- [ ] **Test**: initializing the same month twice creates no duplicates
- [ ] **Test**: deactivating a template before initialization excludes it from the launch
- [ ] **Test**: editing a launched entry leaves the template and sibling months unchanged

## Blocked by

- Blocked by `07-recurring-templates.md`

## User stories addressed

- User story 12
- User story 13
- User story 24
- User story 25
- User story 26
