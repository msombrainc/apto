## MODIFIED Requirements

### App shell scroll behavior

The authenticated app shell SHALL keep the sidebar and page header visible while the user scrolls long operational lists.

#### Scenario: Accounts list scroll

- **WHEN** the operator scrolls a long accounts table on STG
- **THEN** the sidebar navigation, theme toggle, and operator footer remain visible
- **AND** the page title and filter bar remain visible without scrolling off-screen
- **AND** only the table body scrolls within the main content region
