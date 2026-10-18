## MODIFIED Requirements

### Requirement: Accounts SLA column matches preview bar density (apto#125 pass 4)

The accounts list SLA column SHALL render the segmented SLA bar without an additional summary text line in the table cell.

#### Scenario: Accounts table SLA cell

- **WHEN** the operator views the accounts list
- **THEN** each SLA cell shows only the colored segment bar (accessible name via `aria-label`)

### Requirement: Account detail header matches preview panel chrome (apto#125 pass 4)

Account detail SHALL show status pill and SLA segment summary in the header block below the account name.

#### Scenario: Account detail SLA header

- **WHEN** the operator opens an account detail route
- **THEN** the header includes status pill and `SlaSegmentBar` with full summary text

### Requirement: Theme control labeled Dark and Light (apto#125 pass 4)

Authenticated shell and login SHALL expose visible **Dark** and **Light** labels on the theme segment control.

#### Scenario: Sidebar theme labels

- **WHEN** the operator views the sidebar theme control
- **THEN** each theme button shows icon plus visible Dark or Light text
