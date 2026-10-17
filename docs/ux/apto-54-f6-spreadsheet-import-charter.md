# UX charter — apto#54 F6 spreadsheet import

**Route:** `/jobs/:jobId/import/spreadsheet`  
**Entry:** F3 job detail → **Import spreadsheet** (`f3-action-import`)

## Layout

- Page title: **Import assets from spreadsheet**
- Subtitle: job account name + facility (read-only context from `getJob`)
- Step indicator: Upload → Map columns → Preview → Import → Results

## Upload step

- Drop zone + file picker; accept `.csv`, `.xlsx`
- Show row count after parse; error if >500 rows
- `data-testid="f6-upload-input"`

## Map columns

- Four targets: Serial Number, Part Number, Category (optional), Grade (optional)
- Auto-match common header names (case-insensitive): `serial`, `part`, `category`, `grade`
- `data-testid="f6-column-map"`

## Preview

- Table: row #, mapped values, status pill (OK / Error / Skipped)
- Toggle: **Create missing part numbers** vs **Skip rows with unknown parts**
- Primary **Start import** disabled when zero valid rows
- `data-testid="f6-preview-table"`

## Import progress

- Linear progress: `imported / total` valid rows
- Cancel not required for demo (browser refresh aborts)

## Results

- Stat cards: Created, Skipped, Failed
- **Download failed rows** (CSV)
- **Back to job** → `/jobs/:jobId`
- `data-testid="f6-import-results"`

## Visual

- Reuse AIMS `AimsButton`, `DataTable`, `AlertBanner`, light/dark tokens from F3 job detail.
