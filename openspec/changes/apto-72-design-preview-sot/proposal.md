# Change: Mandate Vercel design preview as active UI SoT

**Tracker:** msombrainc/apto#72  
**Change id:** `apto-72-design-preview-sot`

## Problem

Factory agents sometimes relied on charter prose or STG alone for UI. Demo 2 needs a single
interactive SoT until Figma MCP is available.

## Desired outcome

1. Document preview URL + credentials in `docs/ux/README.md` and `DESIGN.md` (done on main).
2. Enforce via app rule `.cursor/rules/factory-design-preview.mdc` (loads in app workspace).
3. Engine `projects/apto/project.yaml` exposes `design_preview` for Athena/Hephaestus skills.

## Out of scope

Pixel-perfect implementation of every screen (apto#99); Figma MCP integration.
