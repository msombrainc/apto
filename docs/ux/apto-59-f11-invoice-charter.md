# UX charter — apto#59 F11 service invoice

**Route:** `/jobs/:jobId/invoice`  
**Entry:** F3 job detail → **Service invoice** (`f3-action-invoice`)

## Layout

- Page title: **Service invoice**
- Subtitle: account name + job id from `getJob`
- Two-column on wide: **Editor** (left) + **History** (right); stack on narrow

## Editor

- Table columns: Service, Qty (editable number), Unit rate, Amount, Hint (muted, e.g. "30 assets Wiped")
- `data-testid="f11-line-{serviceKey}"` per row; `f11-qty-audit`, etc.
- **Note** textarea (`f11-note`)
- **Total** row (`f11-total`)
- Primary **Send to QuickBooks** (`f11-send`); disabled when no QboCustomerId — banner with
  **Sync account to QuickBooks** link to account detail (`f11-qbo-blocked`)
- Loading: "Loading invoice preview…"

## History

- List prior invoices: created date, status badge (Draft/Queued/Sent/Failed), total, QBO #
- `data-testid="f11-history-item-{id}"`
- Failed: show `lastError` snippet + link to QBO sync queue filtered Create invoice

## Visual

- Reuse AIMS `dashboard-panel`, `AimsButton`, table styles from F3/F10
- Status badges: Sent = green, Failed = red, Queued = amber

## Print

- Not required for F11 (QBO is system of record for PDF)
