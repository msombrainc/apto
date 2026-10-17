## 1. OpenSpec

- [x] Proposal + requirements + business rules (F6 import)

## 2. Implementation

- [x] Route `/jobs/:jobId/import/spreadsheet` + F3 entry
- [x] CSV/XLSX parse, mapping, preview validation, sequential create APIs
- [x] `npm run gate:mr` green

## 3. Verify

- [ ] STG smoke on job detail → import flow (post-deploy)
- [ ] Athena polish (`needs-ux-pass`) — drop zone vs file input if needed
