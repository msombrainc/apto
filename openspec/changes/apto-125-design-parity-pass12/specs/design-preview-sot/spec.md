## MODIFIED Requirements

### Requirement: Job detail shell matches list SLA chrome

When viewing a single job, the application SHALL show an AppShell subtitle describing job edit/intake (not the Jobs list subtitle). The job header SHALL use the same SLA status pill styling and labels as the Jobs & SLA list (`jobSlaPillClass` / `formatJobSlaStatusLabel`).

#### Scenario: Job detail subtitle

- **WHEN** the user navigates to `/jobs/:id`
- **THEN** the page subtitle describes job detail work (assets, SLA, intake actions)
- **AND** it does not show the Jobs list “Pickups in progress…” subtitle

#### Scenario: Job detail status pill

- **WHEN** the job detail header renders SLA status
- **THEN** it uses `jobSlaPillClass` and `formatJobSlaStatusLabel` for the status text

### Requirement: Account detail back navigation matches list title

The account detail back control SHALL read “Customer accounts” to match the accounts list page title.

#### Scenario: Back link label

- **WHEN** the user is on account detail
- **THEN** the back link text includes “Customer accounts”
