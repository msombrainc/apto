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
