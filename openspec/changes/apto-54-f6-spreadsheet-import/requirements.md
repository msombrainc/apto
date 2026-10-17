# Requirements — F6 spreadsheet import

## Functional

| ID | Requirement |
|----|-------------|
| FR-0601 | Operator SHALL upload `.csv` or `.xlsx` on the job import page for the current `jobId`. |
| FR-0602 | System SHALL let operator map columns to serial, part number, category, grade. |
| FR-0603 | Preview SHALL show each row with pass/fail and human-readable reasons before import. |
| FR-0604 | Part number SHALL be required per row; serial MAY be empty. |
| FR-0605 | Duplicate serials within the file SHALL fail validation on affected rows. |
| FR-0606 | Serials already in AIMS (lookup) SHALL fail validation unless row is skipped. |
| FR-0607 | Unknown grade or category values SHALL fail validation. |
| FR-0608 | Operator SHALL choose policy for unknown part numbers: create or skip. |
| FR-0609 | Import SHALL create assets via existing job asset API; max 500 rows per file. |
| FR-0610 | After import, operator SHALL see created/skipped/failed counts and MAY download failed rows CSV. |

## UX

| ID | Requirement |
|----|-------------|
| UX-0601 | Primary path from F3 `f3-action-import` navigates to import route (not modal stub). |
| UX-0602 | Cancel/back returns to job detail without losing `jobId`. |
