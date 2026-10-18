# apto#125 — design preview parity pass 12

## Why

Parent apto#125 matrix still below ≥95. Pass 12 fixes job detail shell chrome (correct AppShell subtitle, hero panel, list-aligned SLA status pill) and aligns account detail back navigation with preview list framing.

## What

- App shell: job detail route gets its own subtitle (not Jobs list copy).
- Job detail: compact hero panel + shared `jobSlaPill` status label (matches Jobs & SLA table).
- Account detail: back link reads “Customer accounts” (matches list page title).

## Scope

UI/CSS only; no API changes.
