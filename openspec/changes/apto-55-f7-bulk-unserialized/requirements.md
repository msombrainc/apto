# Requirements — F7 bulk unserialized

## R-F7-01 Entry

WHEN the operator opens job detail THEN **Bulk unserialized** navigates to
`/jobs/{jobId}/import/bulk` with job context loaded.

## R-F7-02 Form validation

WHEN quantity is outside 1–500 OR part number is missing THEN primary create is disabled
and inline errors are shown.

## R-F7-03 Create loop

WHEN the operator confirms create THEN the client issues N sequential asset creates without
serial and shows progress `created / N`.

## R-F7-04 Results

WHEN the loop completes THEN the UI lists created Apto IDs and offers CSV download and
**Back to job**.
