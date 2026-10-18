## MODIFIED Requirements

### Requirement: Accounts SLA column visualization

The accounts list SHALL render SLA as a segmented bar only in the table column, without a duplicate summary text line beneath the bar for any row, including accounts with unset (zero-day) SLA segments.

#### Scenario: Unset SLA in table

- **WHEN** an account has zero total SLA days
- **THEN** the SLA table cell shows a muted placeholder without the `sla-summary` class

### Requirement: Admin QuickBooks sync link styling

QuickBooks sync queue row actions and AIMS record links SHALL use the shared `btn-link` token class for visual parity with other admin tables.
