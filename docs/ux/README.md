# Apto AIMS design SoT

## Active SoT (factory — use this)

| Artifact | Location |
|----------|----------|
| **Interactive preview (primary)** | https://apto-aims-preview.vercel.app |
| Username | `apto-inventory` |
| Password | `apto2026` |

Athena and Hephaestus **must** open this preview in browser MCP (Playwright), sign in, and match light **and** dark screens for the ticket’s surfaces. Capture baselines under `docs/ux/screenshots/` or the UX run folder. Preview wins over legacy STG shell for look-and-feel.

Product tokens / rules: repo root [`DESIGN.md`](../../DESIGN.md).

## Secondary (until Figma MCP)

| Artifact | Location |
|----------|----------|
| Cloud Figma | https://www.figma.com/design/RZCUc2Egsh0HnvLTuGKPVw/Apto-AIMS |
| Local `.fig` export | [`Apto-AIMS.fig`](./Apto-AIMS.fig) |

Do **not** invent layout from charter prose alone when the surface exists in the preview.

## Factory gates (apto#126)

When engine `projects/apto/project.yaml` has `design_preview.url`, **every UI-touching ticket**
(`needs-ux-pass`, `impl-ux`, or UI diff paths) requires Athena **Mode B** charter even without
`ux-charter-first`. Hephaestus must not implement UI until the tracker has:

- `UX_CHARTER_READY` (parity matrix / slice charter), **and**
- `DESIGN_PREVIEW_REVIEWED` (live Browser MCP pass vs this preview URL), **or**
- `BROWSER_REVIEW_SKIP: <reason>` when preview cannot be opened.

Enforced by dev-agent `check_ux_kick_gate.sh` (shipped **dev-agent#147**). UX pipeline:
`ux-agent/docs/UX-PIPELINE.md`.

## Factory tickets

Demo 2 slices and UI work: see open `impl-dev` / `ux-charter-first` issues. Mandate tracking: **apto#72**.
