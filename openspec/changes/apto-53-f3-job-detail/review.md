# Skeptical review — apto-53-f3-job-detail

## Blocking issues

None.

## Suggestions

- Add `discovery.md`, `acceptance.feature`, and `traceability.md` before implement if ba-agent
  `lint:requirements` is enforced on this change (apto-52 minimal shell skipped those files).
- Athena UX charter for layout parity with F2 account detail.
- When F6/F7/F10/F11 merge, replace stub actions with real routes and remove placeholder copy.

## Risks

- Ops status validation may reject legacy free-text statuses stored before F13 seeding — migration
  or normalize-on-read may be needed if STG has dirty rows.
- Category column on job assets requires part-number join enrichment not present on `AssetResponse`
  today (FR-0308).
