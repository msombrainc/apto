# Skeptical review — apto-51-f2-account-detail

## Blocking issues

None.

## Major (non-blocking)

- **M1:** F3 job detail route may not exist when F2 ships first — confirm implement tasks link jobs
  table to the correct path (`/jobs/:jobId` or placeholder) to avoid dead links in demo script step 2.
- **M2:** Today `PUT` enqueues QBO on **code** change; BR-0208 narrows to name/billing address per
  Demo2-Plan — implementers should remove code-only enqueue to avoid unnecessary QBO updates.

## Minor

- **m1:** Fee schedule has ten services; UX should group or table them for scanability (Athena charter).
- **m2:** Dot-path field names in change log (`settings.fees.audit`) should be stable for filter dropdown.

## Reviewer verdict

Requirements are testable, aligned with Demo2-Plan §F2 and extraction FR-9–12/16/17, and explicitly
exclude rule enforcement. Lint (when added) and `BA_SPEC_READY` may proceed.
