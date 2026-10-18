# Change: Design preview parity pass 10 (apto#125)

## Why

QA RETURN on pass 9: STG inventory browse showed legacy six-column defaults (Part/Serial/Account/Facility/Job/Created) instead of the authenticated preview SoT (APTO/Serial/Part/Grade/Status/Account).

## What

- Default visible inventory columns align with design preview charter.
- **APTO** column header label matches preview (not “Apto ID”).

## Impact

- `apps/web/src/inventoryListColumns.ts`
- Contract tests `tests/web/apto-125-design-parity.test.ts`
