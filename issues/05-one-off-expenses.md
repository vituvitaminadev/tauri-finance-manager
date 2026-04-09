## Parent PRD

[../PRD.md](../PRD.md)

## What to build

End-to-end management of one-off (non-recurring, non-installment) expense entries for a given month. This slice delivers the `expense_entries` schema, tRPC procedures, and the expense section of the monthly view UI.

Each expense has: name, value, payment method (debit, PIX, boleto, cash, or credit card), and category. When the payment method is "credit card", the user selects from their named credit cards (from slice 03). The category is selected from the profile's category list (also from slice 03).

Fixed expenses, installments, and auto-launch are handled in later slices. The schema must include the nullable foreign keys for those (fixed_expense_id, installment_group_id, installment_index, installment_total) even though they won't be used yet, to avoid a future migration breaking existing data.

## Acceptance criteria

- [ ] Expense entries for the selected month are listed, scoped to the active profile
- [ ] Users can add an expense with name, value, payment method, and category
- [ ] Payment method options are: Débito, PIX, Boleto, Dinheiro, Cartão de Crédito
- [ ] When "Cartão de Crédito" is selected, a secondary dropdown shows the profile's credit cards
- [ ] Category is selected from the profile's category list
- [ ] Users can edit an existing expense entry
- [ ] Users can delete an expense entry (with confirmation)
- [ ] All monetary values stored as integers (centavos) and displayed as formatted BRL currency
- [ ] Expense section updates immediately after any add/edit/delete without a full page reload
- [ ] Schema includes nullable columns for fixed_expense_id, installment_group_id, installment_index, installment_total (unused in this slice)

## Blocked by

- Blocked by `03-category-and-credit-card-management.md`

## User stories addressed

- User story 16
- User story 17
- User story 18
- User story 19
- User story 20
- User story 21
- User story 22
