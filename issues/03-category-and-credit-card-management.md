## Parent PRD

[../PRD.md](../PRD.md)

## What to build

End-to-end management of categories and credit cards — both scoped to the active profile. This slice delivers the database schemas, tRPC procedures, and a Settings page (or section) where users can manage their categories and credit cards.

On first launch for a new profile, a set of predefined categories is automatically seeded: Food, Health, Leisure, Transport, Housing, Education, Entertainment, Clothing, Subscriptions, Other. Users can add custom categories, rename any category, and delete categories they don't use. Credit cards are simple named entries (e.g., "Nubank", "Itaú") used later when registering credit expenses.

These entities are prerequisites for the expense and category limit slices.

## Acceptance criteria

- [ ] Predefined categories are seeded automatically when a new profile is created
- [ ] Categories and credit cards are correctly scoped to the active profile
- [ ] Users can create a new custom category with a name
- [ ] Users can rename any category (predefined or custom)
- [ ] Users can delete a category (with confirmation); deletion is blocked or warned if the category has existing expense entries
- [ ] Users can create a named credit card
- [ ] Users can rename a credit card
- [ ] Users can delete a credit card (with confirmation)
- [ ] All CRUD operations are reflected immediately in the UI without a full page reload
- [ ] A Settings page (or modal) exposes both category and credit card management sections

## Blocked by

- Blocked by `02-profile-management.md`

## User stories addressed

- User story 34
- User story 35
- User story 36
- User story 37
- User story 41
- User story 42
- User story 43
