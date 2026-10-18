## MODIFIED Requirements

### Requirement: Accounts SLA table matches preview segment labels

The accounts list SLA column SHALL render bar-only `SlaSegmentBar` with visible per-segment day labels and total (`= Nd`) matching the authenticated design preview table.

#### Scenario: Segment labels visible

- **WHEN** an account row has non-zero receiving, processing, and shipping SLA days
- **THEN** the SLA cell shows `{r}d`, `{p}d`, `{s}d`, and `= {total}d` label row under the segmented bar
- **AND** the bar `aria-label` uses preview phrasing (`Receiving N days, processing …`)

### Requirement: Admin page titles match sidebar labels

Reference Data, Part Numbers, and QuickBooks Sync page titles SHALL match Admin sidebar nav capitalization.

#### Scenario: Admin titles

- **WHEN** the user navigates to `/admin/reference-data`, `/admin/part-numbers`, or `/admin/qbo-sync`
- **THEN** the AppShell title reads Reference Data, Part Numbers, or QuickBooks Sync respectively
