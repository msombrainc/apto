# Business rules — F10 certificates

## BR-F10-01 Certificate groups

Asset-status `certificateGroup` SHALL be one of `Recycled`, `Wiped`, `Shredded` when set
(F13). Assets with unknown status or status without a certificate group are **excluded**.

## BR-F10-02 Type mapping

| Certificate type | Included certificate groups |
|------------------|----------------------------|
| Recycling | Recycled |
| Data Destruction | Wiped, Shredded |

## BR-F10-03 Sample marking

Every Demo 2 certificate preview SHALL display **SAMPLE** prominently (not removable in UI).

## BR-F10-04 No persistence

The factory SHALL NOT add certificate storage, numbering, or server-side PDF generation in
this slice.
