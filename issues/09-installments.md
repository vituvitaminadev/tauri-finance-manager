## Parent PRD

[../PRD.md](../PRD.md)

## What to build

End-to-end installment purchase support. When a user registers a credit card purchase as installments (e.g., 12x R$100), the system automatically creates one `expense_entry` per month for the full duration, all linked to an `installment_groups` record.

Each generated entry is labeled `{name} ({index}/{total})` (e.g., "Smart TV Samsung (3/12)"). In the monthly view, only the entry belonging to that specific month is visible — the user sees their actual monthly cash flow.

Users can cancel remaining installments (deletes future entries in the group, preserving past ones) and edit the value of any individual installment occurrence without affecting others.

Tests for this slice must use a real in-memory SQLite database (no mocks).

## Acceptance criteria

- [ ] Users can register an installment purchase with: name, total amount, number of installments, credit card, category, and start month
- [ ] The system creates exactly N `expense_entries`, one per month starting from the selected start month
- [ ] Each entry is labeled `{name} ({n}/{total})` (e.g., "Smart TV Samsung (1/12)", "Smart TV Samsung (2/12)", …)
- [ ] In the monthly view, only the installment entry for that specific month appears
- [ ] Users can edit the value of a single installment occurrence without affecting other occurrences
- [ ] Users can cancel remaining installments: future entries are deleted, past entries are preserved
- [ ] Cancelled entries do not reappear when navigating to future months
- [ ] All monetary values stored as integers (centavos) and displayed as formatted BRL currency
- [ ] **Test**: creating a 12-installment purchase starting in January generates exactly 12 entries in consecutive months
- [ ] **Test**: editing installment #3 does not change installments #1, #2, or #4+
- [ ] **Test**: cancelling from installment #5 onward deletes entries #5–#12 and preserves #1–#4

## Blocked by

- Blocked by `05-one-off-expenses.md`

## User stories addressed

- User story 29
- User story 30
- User story 31
- User story 32
- User story 33
