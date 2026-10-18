## ADDED Requirements

### Requirement: Primary operations list parity baseline (apto#125 pass 1)

Authenticated list surfaces **Login**, **Accounts**, **Jobs & SLA**, and **Inventory** SHALL align page titles, KPI labels, and default table density with the design preview charter `docs/ux/apto-125-screen-parity-charter.md` without inventing a new token palette.

#### Scenario: Login hero in light theme

- **WHEN** the user selects light theme on the login page
- **THEN** the left hero panel SHALL retain the dark branded gradient and light-on-dark typography matching the preview login frame

#### Scenario: Inventory list defaults

- **WHEN** the user opens Inventory with no saved column preferences
- **THEN** the page title SHALL be “Inventory” and the default visible columns SHALL be the compact six-column preview set (Apto ID, Serial, Part #, Grade, Status, Account)

#### Scenario: Jobs list preview columns

- **WHEN** the user opens Jobs & SLA with no saved column preferences
- **THEN** the default columns SHALL emphasize Account, Facility, Ops status, Deadline, Days left, and Status (SLA) per the charter

#### Scenario: Accounts SLA visualization

- **WHEN** the accounts table renders SLA data
- **THEN** each row SHALL show the segmented SLA bar visualization instead of separate numeric Input/Settlement/Sales columns

#### Scenario: Accounts status filter disclosure

- **WHEN** the accounts list primary filter bar is shown
- **THEN** the status filter (`f2-accounts-filter-status`) SHALL live under a collapsed “More filters” disclosure so the primary bar matches preview density while BR-0210 status query remains available
