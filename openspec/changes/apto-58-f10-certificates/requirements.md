# Requirements — F10 certificates

## R-F10-01 Entry

WHEN the operator opens job detail THEN **Certificate** navigates to
`/jobs/{jobId}/certificate` (`data-testid="f10-certificate-page"`).

## R-F10-02 Type selection

WHEN the certificate page loads without a selected type THEN the operator SHALL choose
**Recycling** or **Data Destruction** (`f10-type-recycling`, `f10-type-destruction`).

## R-F10-03 Covered assets

WHEN type is **Recycling** THEN covered assets are those whose asset-status reference row has
`certificateGroup` = `Recycled`.

WHEN type is **Data Destruction** THEN covered assets have `certificateGroup` ∈ {`Wiped`, `Shredded`}.

Matching uses the asset's `status` field against reference item `code` or `name` (case-insensitive).

## R-F10-04 Excluded summary

WHEN one or more job assets are not covered THEN the preview shows an excluded count
(`f10-excluded-count`) without listing every excluded row on the printable certificate.

## R-F10-05 Preview content

WHEN preview is shown THEN it includes issuer (Apto), client account name/code, job id,
facility, start/due dates, asset table columns per plan, total covered count, compliance
statement appropriate to type, signature block, and a visible **SAMPLE** mark
(`f10-sample-watermark`).

## R-F10-06 Print

WHEN the operator activates **Print** (`f10-print`) THEN the browser print dialog opens and
print CSS hides chrome (nav, type picker, actions) while keeping the certificate body.

## R-F10-07 Navigation

WHEN the operator chooses **Back to job** THEN navigation returns to `/jobs/{jobId}`.
