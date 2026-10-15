# Skeptical review — apto-47-f12-qbo-sync-queue

## Blocking issues

None.

## Major (non-blocking)

- **M1:** F11 `ServiceInvoice` enqueue and item/invoice HTTP payloads are stubbed in FR-1226 only;
  confirm OpenSpec tasks split invoice producer vs queue infrastructure.

## Minor

- **m1:** `entityLabel` derivation for list API (account name) should match account list display
  field to avoid duplicate queries — implementation detail.

## Reviewer verdict

Requirements are testable, aligned with Demo2-Plan §F12 and apto#47 scope (queue + worker + admin
+ account refactor). Lint and `BA_SPEC_READY` may proceed.
