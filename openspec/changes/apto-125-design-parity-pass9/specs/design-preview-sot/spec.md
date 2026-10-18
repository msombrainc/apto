# design-preview-sot (delta pass 9)

## MODIFIED Requirements

### Jobs & SLA list matches authenticated preview

The Jobs & SLA surface SHALL use preview copy for subtitle, KPI sublabels, search placeholder, facility pill filter on the primary filter row, and **Ops status** column header.

#### Scenario: Operator opens Jobs & SLA on STG

- **WHEN** the operator navigates to the jobs list
- **THEN** the page subtitle references pickups in progress and SLA focus cards
- **AND** KPI cards show preview sublabels (open across facilities, within SLA window, running out of time, SLA breached)
- **AND** the search placeholder reads “Filter by job ID or account”
- **AND** facility pills appear adjacent to the compact filter bar

### Accounts list subtitle matches preview

#### Scenario: Operator opens Accounts on STG

- **WHEN** the operator navigates to the accounts list without a selected account
- **THEN** the page subtitle matches the design preview accounts lede
