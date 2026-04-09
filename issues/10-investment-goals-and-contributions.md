## Parent PRD

[../PRD.md](../PRD.md)

## What to build

End-to-end investment tracking: goal creation, contribution logging, and progress visualization. This slice delivers the `investment_goals` and `investment_contributions` schemas, all tRPC procedures, and the Investments page UI.

A goal has a name and an optional target amount. Goals without a target are open-ended (e.g., emergency fund). Users can log one or more contributions per goal per month. The UI shows each goal as a card displaying the total accumulated across all contributions, and — if a target is set — the percentage progress toward it.

Archived goals are hidden from the main view but their data is preserved for the annual overview.

Tests for this slice must use a real in-memory SQLite database (no mocks).

## Acceptance criteria

- [ ] Users can create an investment goal with a name and an optional target amount
- [ ] Goals without a target amount are supported and display total accumulated only (no percentage)
- [ ] Users can add one or more contributions to a goal for a given month, each with an amount and an optional note
- [ ] Users can edit a contribution's amount or note
- [ ] Users can delete a contribution (with confirmation)
- [ ] Each goal card displays the total accumulated across all contributions
- [ ] Goals with a target display a progress bar showing percentage toward the target
- [ ] Users can archive a goal; archived goals disappear from the main view
- [ ] All monetary values stored as integers (centavos) and displayed as formatted BRL currency
- [ ] **Test**: total accumulated is the sum of all contributions across all months for a goal
- [ ] **Test**: percentage is (total accumulated / target) × 100, capped display at 100% in the UI
- [ ] **Test**: deleting a contribution recalculates the total correctly

## Blocked by

- Blocked by `02-profile-management.md`

## User stories addressed

- User story 44
- User story 45
- User story 46
- User story 47
- User story 48
- User story 49
- User story 50
- User story 51
