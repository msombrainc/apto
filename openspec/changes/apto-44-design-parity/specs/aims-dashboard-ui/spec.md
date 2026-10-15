# AIMS operations dashboard UI (apto#44)

## ADDED Requirements

### Requirement: Accounts dashboard composition
The Accounts view SHALL present KPI cards (account count and average SLA), a debounced name/code filter with result count, a data table with avatar, code pill, and SLA segment visualization, and SHALL create accounts via a modal triggered by **New account** while using existing list/create APIs.

#### Scenario: Operator lists accounts
- **WHEN** the operator opens Accounts after login
- **THEN** the page shows KPI row, filter field, and table styled per Figma baselines without an always-visible create card

### Requirement: Jobs dashboard composition
The Jobs view SHALL show four SLA KPI cards, refresh and **New job** actions, search and facility filters, and a rich jobs table with SLA pills and row selection preserving job/asset workflows.

#### Scenario: Operator filters jobs
- **WHEN** the operator selects a facility pill or account filter
- **THEN** the jobs table updates client-side without changing API field names

### Requirement: Inventory dashboard composition
The Inventory view SHALL show asset KPI cards, debounced serial/part search, account and facility filters, and a browse table with row selection for asset detail.

#### Scenario: Operator browses inventory
- **WHEN** the operator types in the inventory search field
- **THEN** the app queries `/api/assets` with debounced `q` and displays an asset count label

### Requirement: Shared dashboard primitives
The web app SHALL implement reusable dashboard components (stat cards, filter bar, data table shell, avatars, code pill, SLA segment bar, primary/secondary actions) using CSS variables from `styles.css`.

#### Scenario: Theme consistency
- **WHEN** the operator toggles light or dark theme
- **THEN** dashboard surfaces use existing `--aims-*` tokens without hard-coded page backgrounds
