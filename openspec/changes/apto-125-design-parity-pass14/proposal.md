# apto#125 — design preview parity pass 14

## Why

Parent apto#125 matrix still below ≥95. Pass 14 aligns account detail SLA field labels and rules tab layout with preview, tightens admin/QBO panel chrome, and syncs light-theme muted text to DESIGN.md tokens.

## What

- Account detail: Receiving / Processing / Shipping (days) labels; rules/services tab left-aligned multi-column grid.
- QBO sync: connection section heading + preview panel spacing.
- Reference Data + Part Numbers: shared `admin-preview-panel` table density.
- Light theme `--aims-text-muted` → `#64748b` per DESIGN.md.

## Scope

UI/CSS only; no API changes.
