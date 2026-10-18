## MODIFIED Requirements

### Requirement: Accounts list matches preview table model

The accounts list SHALL use the preview column set (Account, Code, SLA, open chevron) without a Status column on the list surface. Status filtering SHALL remain available under More filters.

#### Scenario: Accounts list headers

- **WHEN** the accounts list renders
- **THEN** the page title reads **Customer accounts**
- **AND** the SLA column header reads **SLA · receiving / processing / shipping**
- **AND** the table has no Status column

### Requirement: Accounts KPI labels match preview

The first KPI card on the accounts list SHALL label the count **Accounts** with sublabel **Active customers** when the status filter is Active.

#### Scenario: Default active accounts KPI

- **WHEN** the status filter is Active and search is empty
- **THEN** the KPI label is **Accounts** and sublabel is **Active customers**
