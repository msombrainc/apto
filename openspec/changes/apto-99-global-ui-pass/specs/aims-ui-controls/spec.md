# aims-ui-controls (delta)

## ADDED Requirements

### Requirement: Styled selects

All product `<select>` elements SHALL use the shared `.aims-select` class and SHALL NOT render with native OS dropdown chrome.

#### Scenario: Filter bar select

- **WHEN** the operator opens a list filter select on Accounts, Jobs, or Inventory
- **THEN** the control shows themed background, border, custom chevron, and default width between 12rem and 14rem on wide viewports

### Requirement: Control widths

Form and filter controls SHALL respect preview density (no full-bleed inputs in filter rows; dashboard primary actions auto-width except login).

#### Scenario: Dashboard primary action

- **WHEN** the operator views a dashboard header with Refresh / New actions
- **THEN** primary buttons are sized to label content, not 100% of the content column
