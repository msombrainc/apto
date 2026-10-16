# Apto factory — GitHub Issues

Backlog = **GitHub Issues** on [`msombrainc/apto`](https://github.com/msombrainc/apto).

Engine slug: **`apto`**. Product code only in this repo.

## Bootstrap

Parent issue carries `project-bootstrap` + `apto`. When ready for WBS, add **`impl-dev`**
to the parent → Hephaestus demux → Chronos → Hermes WBS → child issues with `impl-dev`.

Runbook: `dev-agent/docs/NEW-PRODUCT-FACTORY.md`.

## Labels

| Label | Owner |
|-------|--------|
| `apto` | all |
| `project-bootstrap` | Chronos |
| `impl-dev` | Hephaestus |
| `ba-spec-first` | Hermes |
| `needs-ux-pass` | Athena |
| `validate-testing` | Argus |
| `done` | Argus |
| `human-required` | Human |
| `factory-pause` | Human |


## Design SoT (UI)

Until Figma MCP is available, factory UI work **must** use the interactive preview:

- https://apto-aims-preview.vercel.app — `apto-inventory` / `apto2026`
- Details: `docs/ux/README.md`, `DESIGN.md`, apto#72

Athena opens it via browser MCP; Hephaestus implements to those baselines.

## PR hygiene

- `Related: #N` until Argus PASS — not `Fixes #N` on implement PRs.
