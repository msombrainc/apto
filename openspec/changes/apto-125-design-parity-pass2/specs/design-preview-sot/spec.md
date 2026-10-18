## ADDED Requirements

### Detail and admin shell parity (apto#125 pass 2)

Authenticated **account detail**, **job detail**, **warehouse scan**, and **admin** routes SHALL NOT show the global asset lookup control in the app header.

#### Scenario: Account detail without Find asset

- **WHEN** the operator opens `/accounts/:id`
- **THEN** the header SHALL omit the global asset lookup field

#### Scenario: Admin actions use design tokens

- **WHEN** reference data or part numbers tables render row action links
- **THEN** action buttons SHALL use accent token styling (not unstyled default link blue)
