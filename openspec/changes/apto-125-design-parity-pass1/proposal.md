# Change: Design preview parity pass 1 (apto#125)

## Why

Athena Mode B matrix on apto#125 shows 0/5 live preview screens ≥95%. Worst gaps: Inventory (42), Jobs (48), Accounts (54), Login light hero (62).

## What

- Login: keep dark branded hero in **light** app theme (preview SoT).
- Inventory: title **Inventory**, preview KPI labels, compact default columns, advanced filters behind disclosure.
- Jobs & SLA: page title, preview-oriented default columns (Account → Status), compact FilterBar + advanced disclosure.
- Accounts: SLA segment bar column (replace numeric SLA cols), preview KPI copy; hide global “Find asset” on primary list surfaces.
- Charter doc tracked: `docs/ux/apto-125-screen-parity-charter.md`.

## Impact

- `apps/web/src/*`, `styles.css`, contract tests `tests/web/apto-125-design-parity.test.ts`.
