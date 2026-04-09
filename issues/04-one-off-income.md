## Parent PRD

[../PRD.md](../PRD.md)

## What to build

End-to-end management of one-off (non-recurring) income entries for a given month, plus the month/year navigation that will be shared across the entire monthly view. This slice delivers the `income_entries` schema, tRPC procedures, and the income section of the monthly view UI.

The monthly view opens on the current month by default. A month/year selector at the top allows navigating to any other month. The income section lists all entries for the selected month and allows adding, editing, and deleting them. Each entry has a name and a value (in BRL).

Recurring income templates and auto-launch are handled in slices 07 and 08. This slice only covers manually-created one-off entries.

## Acceptance criteria

- [ ] Monthly view opens on the current month by default
- [ ] Month/year selector allows navigating forward and backward
- [ ] Income entries for the selected month are listed, scoped to the active profile
- [ ] Users can add an income entry with a name and value
- [ ] Users can edit an existing income entry's name or value
- [ ] Users can delete an income entry (with confirmation)
- [ ] All monetary values are stored as integers (centavos) and displayed as formatted BRL currency
- [ ] Income section updates immediately after any add/edit/delete without a full page reload

## Blocked by

- Blocked by `02-profile-management.md`

## User stories addressed

- User story 10
- User story 15
- User story 52
- User story 53
