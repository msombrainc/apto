# Business rules — F13 reference data

## BR-1301 Facility code uniqueness

Facility `Code` SHALL be unique among all `ReferenceItem` rows where `Type = facility` (case-insensitive compare).

## BR-1302 Location scope

Location `Code` SHALL be unique within the parent facility (`ParentId` → facility `ReferenceItem.Id`). Location rows MUST have `ParentId` set.

## BR-1303 Reference code uniqueness by type

For types other than `location`, `Code` SHALL be unique within `Type` (case-insensitive).

## BR-1304 Active-only dropdowns

`GET` list endpoints used for dropdowns SHALL return only `IsActive = true` rows unless query `includeInactive=true` (admin lists).

## BR-1305 Asset status groups

Each asset-status row SHALL have `Group` ∈ {`WIP`, `Finished`, `Exception`}. `CertificateGroup` MAY be `Recycled`, `Wiped`, or `Shredded` when applicable.

## BR-1306 Sort order

`SortOrder` is an integer ≥ 0; lists default sort `SortOrder` ascending then `Name` ascending.

## BR-1307 Categories and part numbers

Category rename SHALL NOT cascade automatically to part numbers; `GET /api/categories` returns `partNumberCount` for impact visibility.

## BR-1308 Deactivate in-use entries

Entries with `inUseCount` > 0 MAY be deactivated (`IsActive = false`) but SHALL NOT be physically deleted.
