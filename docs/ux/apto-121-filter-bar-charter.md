# apto#121 — Filter bars + control/label layout (Mode B charter)

**Status:** Frozen for implement (2026-10-17)  
**Tracker:** msombrainc/apto#121  
**Design SoT:** [AIMS preview](https://apto-aims-preview.vercel.app) (`apto-inventory` / `apto2026`)

**DESIGN_PREVIEW_REVIEWED:** 2026-10-17 — Accounts / Jobs / Inventory filter rows on preview: labels above controls, 12–14rem filter selects, search capped ~24rem, flex-wrap with ≥0.75rem gutters; no overlapping chips or actions.

## Implement mandates

1. **Shared FilterBar** — `.filter-bar` uses `display:flex; flex-wrap:wrap; align-items:flex-end; gap:0.75rem 1rem`; children `flex:0 0 auto`; meta count never overlaps controls (`margin-left:auto` on wide rows).
2. **Labeled selects** — `.filter-bar__select` stacks label + control; label `font-size:0.85rem`, `color:var(--aims-text-muted)`, min-width 12rem, max-width 14rem on `.aims-select`.
3. **No internal scroll trap** — remove `max-height` scroll on sticky filter bar inside table panels; allow wrap instead of clipping (apto#107 sticky table region unchanged).
4. **Admin filter rows** — `.ref-admin-filters`, `.inventory-filters-row`, `.jobs-filters` share the same gap/align-end rules.
5. **Regression** — extend `tests/web/ui-controls.test.ts` or new `filter-bar-layout.test.ts` asserting flex-end + no max-height on dashboard filter-bar.

UX_CHARTER_READY
