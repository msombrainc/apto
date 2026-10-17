# apto#107 — Sticky shell + design-system controls (Mode B charter)

**Status:** Frozen for implement (2026-10-17)  
**Tracker:** msombrainc/apto#107  
**Design SoT:** [AIMS preview](https://apto-aims-preview.vercel.app) (`apto-inventory` / `apto2026`)  
**Builds on:** apto#99 global rules (`docs/ux/apto-99-global-ui-pass-charter.md`)

**DESIGN_PREVIEW_REVIEWED:** 2026-10-17 — Re-confirmed Accounts/Jobs list scroll behavior on preview: sidebar + page chrome remain fixed; table body scrolls inside the main column.

## Implement mandates

1. **Sticky shell** — `100vh` app grid; sidebar fixed height with internal scroll if needed; main column `page-header` + toolbar (actions/KPI/filter) visible; **only** table/long body scrolls inside `.dashboard-panel` or `.page-content`.
2. **Selects** — all `<select>` use `.aims-select` (audit F15/SLA if any gap).
3. **Control widths** — preserve apto#99 `max-width: 28rem` on form fields; filter selects `12–14rem`; header buttons `width: auto`.
4. **Dark contrast** — table headers, muted copy, and in-table links meet preview; bump `--aims-text-muted` / link token usage on data tables.
5. **Chips** — `status-pill` / `code-pill` use elevated surface + border (preview chip language).

UX_CHARTER_READY
