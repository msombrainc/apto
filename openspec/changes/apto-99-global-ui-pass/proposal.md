# apto#99 — Global UI pass vs design preview

## Why

Demo 2 STG surfaces still use native select chrome, oversized controls, and inconsistent contrast vs the Vercel AIMS preview SoT (apto#72).

## What Changes

- Shared `.aims-select` styling (appearance none, chevron, themed borders)
- Filter-bar and form control max-widths per `docs/ux/apto-99-global-ui-pass-charter.md`
- Dashboard primary buttons no longer full-bleed except login
- Light-theme ghost button borders readable on white panels

## Charter

`docs/ux/apto-99-global-ui-pass-charter.md` (`UX_CHARTER_READY` on #99).
