# Assumptions — apto#48

## ASSUMPTION-481 AptoId format and backfill

New assets SHALL receive `AptoId` on create as `A` + zero-padded decimal sequence (minimum 7 digits,
e.g. `A0000001`). Migration SHALL backfill existing assets in ascending `CreatedAtUtc` order
without gaps in the assigned sequence. `AptoId` comparison for lookup is case-insensitive; stored
canonical form is uppercase `A` + digits.

## ASSUMPTION-482 Preset storage

Scan presets SHALL persist in `localStorage` under key `apto.f8Scan.presets.v1` as JSON array:
`{ id, name, isGlobal, fields: { grade?, status?, locationId?, partNumberMode? }, createdBy }`.
`isGlobal` presets are visible to all users on the same browser profile; user-scoped presets have
`isGlobal: false`. No server sync in Demo 2.

## ASSUMPTION-483 Scan feedback

Success and failure SHALL use distinct `data-testid` banner states plus a short Web Audio beep
(success 880 Hz 80 ms, failure 220 Hz 120 ms) when the browser allows `AudioContext`; when audio
is blocked, visual feedback alone satisfies FR-1418.

## ASSUMPTION-484 Global preset auth

Any user past the demo login gate MAY create or toggle `isGlobal` on a preset (Demo 2 has no roles;
FR-39 production RBAC deferred).

## ASSUMPTION-485 Lookup code normalization

`code` query parameter SHALL be trimmed; serial match is exact case-insensitive equality on
`Asset.SerialNumber`; Apto ID match is exact on normalized `AptoId`. Empty or whitespace-only
`code` returns HTTP 400.

## ASSUMPTION-486 Undo stack

Undo SHALL restore only the **last successful** scan in the current browser session (max depth 1).
Reverting calls `PUT /api/assets/{id}` with previous grade/status/location values captured before
apply.
