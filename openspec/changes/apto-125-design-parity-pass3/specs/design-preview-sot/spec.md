## MODIFIED Requirements

### Requirement: List surfaces match preview filter density (apto#125 pass 3)

Jobs and Inventory SHALL expose only search + primary filters in the default filter bar; column picker, export, and saved-search controls SHALL live in a disclosure (More filters / More tools) until expanded.

#### Scenario: Jobs compact toolbar

- **WHEN** the operator opens Jobs & SLA
- **THEN** Columns and Export are not visible until More filters is expanded

#### Scenario: Inventory compact toolbar

- **WHEN** the operator opens Inventory
- **THEN** Columns, Export page CSV, and Save search are not visible until More tools is expanded

### Requirement: Jobs SLA KPI cards filter the list (apto#125 pass 3)

On-track, At risk, and Overdue KPI cards SHALL toggle the jobs list SLA filter to match the selected band (preview KPI filter cards).

#### Scenario: At risk filter

- **WHEN** the operator activates the At risk KPI card
- **THEN** the jobs table shows only at-risk jobs until the filter is cleared
