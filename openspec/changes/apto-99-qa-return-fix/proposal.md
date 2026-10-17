# apto#99 QA RETURN — filter select width + login contrast

## Why

Argus STG retest on apto#99 (issue #108) found Accounts status filter ~95px wide (spec 12–14rem) and light-theme login muted copy below WCAG 4.5:1.

## What

- Enforce `filter-bar__select` min width so flex layout cannot shrink Accounts status select
- Darken light-theme `--aims-text-muted` for AA contrast on login panel

## Charter

`docs/ux/apto-99-global-ui-pass-charter.md` (unchanged)
