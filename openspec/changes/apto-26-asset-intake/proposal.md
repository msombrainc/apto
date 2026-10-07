# Change: apto#26 Asset intake, edit, change log

**Ticket:** apto#26

## Why

Week-1 demo steps 3 & 6: manual asset create on a job, part-number lookup, single-asset edit with audit trail (FR-29, FR-35, FR-37).

## What

- REST: job assets list/create, asset get/update, part-number search/create.
- `AssetChangeLog` persistence (field, old, new, user, timestamp).
- React: select job → add assets → edit asset with change log table.

## Out of scope

Bulk upload, parent/child, browse inventory (#27).
