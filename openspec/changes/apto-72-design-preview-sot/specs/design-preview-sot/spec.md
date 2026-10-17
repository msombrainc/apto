# design-preview-sot

Factory UI work SHALL treat the Vercel AIMS interactive preview as the primary visual source of truth until Figma MCP is connected.

## ADDED Requirements

### Requirement: Interactive preview credentials

The product SHALL document the preview URL and sign-in credentials in `docs/ux/README.md` and `DESIGN.md`.

#### Scenario: Factory agent locates SoT

- **WHEN** Hephaestus or Athena starts UI work on an `impl-dev` ticket with UX labels
- **THEN** they SHALL read `docs/ux/README.md` for `https://apto-aims-preview.vercel.app` and credentials `apto-inventory` / `apto2026`

### Requirement: App workspace enforcement rule

The app repo SHALL ship `.cursor/rules/factory-design-preview.mdc` so agents opened on the product workspace load preview SoT gates.

#### Scenario: Cursor workspace is the app repo

- **WHEN** an agent edits React UI under `apps/` or `docs/ux/`
- **THEN** the factory design-preview rule SHALL be available under `.cursor/rules/`

### Requirement: Browser review before charter freeze

When `ux-charter-first` is on the ticket, Athena SHALL browser-review matching preview surfaces in light and dark before posting `UX_CHARTER_READY`.

#### Scenario: Charter gate

- **WHEN** `check_ux_kick_gate` blocks implement for missing `UX_CHARTER_READY`
- **THEN** Athena Mode B SHALL use browser MCP against the preview, not STG alone
