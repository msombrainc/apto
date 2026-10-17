# UX charter — apto#55 F7 bulk unserialized

**Route:** `/jobs/:jobId/import/bulk`  
**Entry:** F3 job detail → **Bulk unserialized** (`f3-action-bulk`)

## Layout

- Title: **Bulk add unserialized assets**
- Subtitle: account + facility from `getJob`
- Single-page form (no wizard steps)

## Fields

- **Part number** — search combobox + quick pick **UNIDENTIFIED** (`data-testid="f7-part-search"`)
- **Quantity** — number input 1–500 (`data-testid="f7-quantity"`)
- **Grade** — optional select (`f7-grade`)
- **Status** — optional select (`f7-status`)
- **Location** — optional select filtered to job facility (`f7-location`)

## Actions

- Primary **Create assets** disabled until valid part + quantity
- During create: progress text `Creating k of N…` (`f7-progress`)
- Results: table of Apto IDs (`f7-results-table`), **Download CSV**, **Back to job**

## Visual

- AIMS tokens from F3/F6; `AlertBanner` for errors.
