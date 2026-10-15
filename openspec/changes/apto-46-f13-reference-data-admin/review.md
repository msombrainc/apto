# Skeptical review — apto-46-f13-reference-data-admin

## Blocking issues

None.

## Major (non-blocking)

- **M1:** Full `inUseCount` for asset status/location awaits Asset columns from the shared Demo 2
  migration; ASSUMPTION-461 documents interim behavior — confirm in OpenSpec tasks when F3 lands.

## Minor

- **m1:** Damage list is admin-only in Demo 2 (no consumer UI); keep seed minimal.

## Reviewer verdict

Requirements are testable, aligned with Demo2-Plan §F13 and apto#46 scope (API + admin UI +
migration). Lint and `BA_SPEC_READY` may proceed.
