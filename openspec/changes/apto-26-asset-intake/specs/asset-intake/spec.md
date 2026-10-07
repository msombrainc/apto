# Asset intake and change log (apto#26)

## Requirements

### Requirement: Job asset create
The API SHALL create an asset on a job when a part number is supplied (by id or new number) and SHALL reject missing part number or unknown part id.

#### Scenario: Create asset on job
- **WHEN** client POSTs valid asset JSON to `/api/jobs/{jobId}/assets`
- **THEN** response is 201 with asset id and initial change-log entry

#### Scenario: Missing job
- **WHEN** job id does not exist
- **THEN** response is 404

### Requirement: Asset read and update
The API SHALL return a single asset with change log by id and SHALL apply serial or part-number updates with audit entries.

#### Scenario: Update serial
- **WHEN** client PUTs new serial on existing asset
- **THEN** response is 200 and change log records old and new values

#### Scenario: Missing asset
- **WHEN** client GETs or PUTs unknown asset id
- **THEN** response is 404

### Requirement: Part number lookup
The API SHALL search part numbers by query fragment for intake autocomplete.

### Requirement: React job assets panel
The web app SHALL list assets for the selected job, allow create, and show change log when an asset is selected (Week-1: serial edit in UI; part-number change via API).
