# design-preview-sot (delta pass 8)

## MODIFIED Requirements

### Inventory list matches authenticated preview

The inventory surface SHALL use preview copy for subtitle, KPI sublabels, search placeholder, facility pill filter, and default six-column table layout (part, serial, account, facility, job, created).

#### Scenario: Operator opens inventory on STG

- **WHEN** the operator navigates to the inventory list
- **THEN** the page subtitle reads “Every asset received, across all jobs and facilities.”
- **AND** facility filtering uses segmented pills including All and facility codes
- **AND** the default table shows the six preview columns in charter order
