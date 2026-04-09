## Parent PRD

[../PRD.md](../PRD.md)

## What to build

End-to-end profile management: the database schema, all tRPC procedures, and the full UI for creating and switching between user profiles. This slice also delivers the theme toggle (dark/light mode) persisted per profile.

When the app opens, a profile selection screen is shown (Netflix-style cards with profile names). Clicking a profile loads that user's context for the rest of the app. A profile switcher in the app header allows switching without restarting. From the profile screen, users can create, rename, and delete profiles.

The active profile must be available globally as context so all subsequent slices can scope their data queries to the correct profile.

## Acceptance criteria

- [ ] On first launch, a "Create your first profile" prompt is shown
- [ ] Profile selection screen shows all profiles as cards; clicking one enters the app as that profile
- [ ] Profiles can be created with a name from the selection screen
- [ ] Profiles can be renamed and deleted (with confirmation dialog) from the selection screen
- [ ] Deleting a profile also deletes all associated data (cascading delete in the schema)
- [ ] A profile switcher (avatar/name) in the app header allows switching to another profile
- [ ] Dark/light mode toggle is available in the app and the preference is saved per profile in the database
- [ ] Theme preference is restored correctly when re-entering a profile after a restart
- [ ] Active profile ID is accessible via a React context/store to all child components

## Blocked by

- Blocked by `01-project-scaffold.md`

## User stories addressed

- User story 1
- User story 2
- User story 3
- User story 4
- User story 5
- User story 6
- User story 7
- User story 8
- User story 9
