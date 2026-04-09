## Parent PRD

[../PRD.md](../PRD.md)

## What to build

End-to-end management of recurring income templates and fixed expense templates. This slice delivers the `recurring_income` and `fixed_expenses` schemas, their tRPC CRUD procedures, and the Settings UI sections for managing them.

A **recurring income template** defines a name and a default amount that should be auto-launched every month. A **fixed expense template** defines a name, default amount, payment method, and category.

Templates are not the monthly entries themselves — they are the blueprints. The actual monthly entries are created by the Auto-Launch Service in slice 08. This slice only covers creating, viewing, editing, deactivating, and deleting the templates.

Deactivating a template stops future auto-launches without deleting historical entries. Deleting a template permanently removes it (but not already-created entries).

## Acceptance criteria

- [ ] Settings page has a "Despesas Fixas" section listing all fixed expense templates for the active profile
- [ ] Users can create a fixed expense template with: name, default amount, payment method, and category
- [ ] Users can edit a fixed expense template's name, default amount, payment method, or category
- [ ] Users can deactivate a fixed expense template (stops future auto-launch, preserves history)
- [ ] Users can delete a fixed expense template (with confirmation)
- [ ] Settings page has a "Entradas Recorrentes" section listing all recurring income templates for the active profile
- [ ] Users can create a recurring income template with: name and default amount
- [ ] Users can edit a recurring income template
- [ ] Users can deactivate a recurring income template
- [ ] Users can delete a recurring income template (with confirmation)
- [ ] Templates are correctly scoped to the active profile

## Blocked by

- Blocked by `04-one-off-income.md`
- Blocked by `05-one-off-expenses.md`

## User stories addressed

- User story 11
- User story 14
- User story 23
- User story 27
- User story 28
