## MODIFIED Requirements

### Requirement: Account detail SLA fields use preview segment names

The account detail profile form SHALL label SLA day inputs Receiving, Processing, and Shipping (days) to match the authenticated design preview and segmented SLA bar.

#### Scenario: SLA field labels

- **WHEN** the user opens account detail
- **THEN** the three SLA inputs are labeled Receiving (days), Processing (days), and Shipping (days)

### Requirement: Account rules tab matches preview checkbox rhythm

The Rules and Services tab panels SHALL use a left-aligned multi-column checkbox grid (not a centered sparse column).

#### Scenario: Rules grid layout

- **WHEN** the user selects the Rules tab
- **THEN** checkbox rows render in a responsive multi-column grid with labels left-aligned
