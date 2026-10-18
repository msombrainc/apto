# apto#125 — design preview parity pass 13

## Why

Parent apto#125 matrix still below ≥95. Pass 13 aligns Accounts SLA table cells with preview segmented day labels (45d / 30d / 60d / = total), preview-style SLA aria labels, admin page titles with sidebar nav, and warehouse scan panel chrome.

## What

- `SlaSegmentBar` bar-only: inline segment day labels + preview aria wording.
- App shell titles: Reference Data, Part Numbers, QuickBooks Sync (match nav).
- Warehouse scan: `warehouse-scan-preview-panel` stack class for list parity density.

## Scope

UI/CSS only; no API changes.
