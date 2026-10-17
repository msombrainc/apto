# Change: F14 Part Number management

**Tracker:** msombrainc/apto#50 (SLICE-005)  
**Change id:** `apto-50-f14-part-numbers`  
**Plan SoT:** Demo2-Plan §F14

## Problem

Part numbers are created inline from jobs/assets with a minimal search API. Demo 2 requires
an Admin catalog with paging, sort, category from F13, and safe delete with asset reassignment.

## Desired outcome

1. Extend `/api/part-numbers` with paged list, PUT, DELETE (replacement when in use).
2. Admin UI at `/admin/part-numbers` matching Reference Data patterns.
3. Module map + sidebar navigation for Part Numbers (D2).

## UX

Charter: `docs/ux/apto-50-f14-part-numbers-charter.md` (UX_CHARTER_READY on #50).
