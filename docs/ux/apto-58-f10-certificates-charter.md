# UX charter — apto#58 F10 certificates

**Route:** `/jobs/:jobId/certificate`  
**Entry:** F3 job detail → **Certificate** (`f3-action-certificate`)

## Type step

- Page title: **Compliance certificate**
- Subtitle: account name + facility from `getJob`
- Two large selectable cards:
  - **Recycling** — assets with Recycled status group
  - **Data Destruction** — Wiped and Shredded status groups
- `data-testid="f10-type-recycling"` / `f10-type-destruction`

## Preview step

- Certificate document panel (max-width ~800px, centered) on neutral background
- Diagonal **SAMPLE** watermark across document (`f10-sample-watermark`)
- Header: Apto logo text + "Certificate of Recycling" or "Certificate of Data Destruction"
- Meta grid: Client, Job ID, Facility, Processing period (start–due dates)
- Asset table: Apto ID, Serial, Part #, Category, Status
- Footer: compliance paragraph (type-specific), signature lines (Authorized representative / Date)
- Summary line when excluded > 0: "**N** assets not included on this certificate"
- Actions (non-print): **Change type**, **Print**, **Back to job**
- `data-testid="f10-certificate-preview"`, `f10-print`, `f10-excluded-count`

## Print

- `@media print` hides app shell actions and type picker; watermark and table remain
- White background, black text

## Visual

- Reuse AIMS tokens from F3/F6; certificate uses serif heading for document feel
- Light/dark: preview panel uses `dashboard-panel` in app theme; print always light
