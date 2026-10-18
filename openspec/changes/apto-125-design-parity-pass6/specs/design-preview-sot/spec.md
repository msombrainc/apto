## MODIFIED Requirements

### Requirement: Inventory KPI label reflects filter state

When inventory list filters or search narrow the result set, the primary KPI card SHALL label the total **Matching** instead of **Assets**, consistent with the Jobs & SLA list.

#### Scenario: Filtered inventory browse

- **WHEN** any inventory filter field is non-empty
- **THEN** the first KPI card label reads **Matching**

### Requirement: Admin list search uses FilterBar

Reference Data and Part Numbers admin list panels SHALL use the shared `FilterBar` component for search and result meta text.

#### Scenario: Reference data search row

- **WHEN** the Reference Data admin list panel renders
- **THEN** search uses `FilterBar` with `searchId` `ref-admin-search`
