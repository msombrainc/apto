# f15-prototypes — delta (apto#60)

## ADDED Requirements

### REQ-1501 Prototype banner

Every F15 screen SHALL show the banner text `Prototype — sample data, not connected` with
`data-testid="f15-prototype-banner"`.

#### Scenario: Operator opens a prototype route

- **WHEN** the operator navigates to any F15 route
- **THEN** the prototype banner is visible at the top of the page content

### REQ-1502 F15 routes and module map

The web app SHALL register deep links for user management, order fulfillment, production
dashboard, and asset images; module map entries with `availability: prototype` and a `path`
SHALL be navigable from the sidebar module map.

#### Scenario: Deep link user management

- **WHEN** the operator opens `/admin/user-management`
- **THEN** the user management prototype page renders inside the AIMS shell

### REQ-1503 Sample data only

F15 screens SHALL use browser-local sample data and SHALL NOT call product APIs for their
primary content.

#### Scenario: No network dependency for permissions grid

- **WHEN** the operator toggles a permission on the user management screen
- **THEN** the change is reflected in local state without a server round-trip
