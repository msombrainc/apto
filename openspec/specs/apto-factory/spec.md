# apto-factory

Factory process capabilities for the Apto product repo (not runtime behaviour).

## Requirements

### Requirement: Design preview SoT reference

The factory SHALL maintain `docs/ux/README.md`, `DESIGN.md`, and `FACTORY.md` pointing to the Vercel AIMS preview as primary UI SoT (see `design-preview-sot` change apto#72).

#### Scenario: Onboarding a UI ticket

- **WHEN** a new `ux-charter-first` slice is picked up
- **THEN** the agent SHALL find preview URL and credentials without searching chat history
