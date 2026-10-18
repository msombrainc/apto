# design-preview-sot (delta pass 10)

## MODIFIED Requirements

### Inventory browse default columns match preview

The inventory browse table SHALL default to the six preview columns APTO, Serial, Part number, Grade, Status, and Account.

#### Scenario: Operator opens Inventory on STG

- **WHEN** the operator navigates to inventory browse with default column preferences
- **THEN** the table header row includes **APTO** as the first column
- **AND** the visible default columns are APTO, Serial, Part number, Grade, Status, Account (in preview order)
