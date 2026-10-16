Feature: F8 warehouse scan (apto#48)

  Background:
    Given the apto API and web app are running with apto#48 migration applied
    And reference data from apto#46 is seeded for grades statuses and locations

  Scenario: Lookup by Apto ID returns asset
    Given an asset with AptoId A0001001 and serial SN-1001
    When a client sends GET /api/assets/lookup?code=A0001001
    Then the response status is 200
    And the JSON body aptoId is A0001001

  Scenario: Lookup unknown code returns 404
    When a client sends GET /api/assets/lookup?code=UNKNOWN-CODE
    Then the response status is 404

  Scenario: Ambiguous serial returns 409
    Given two assets with serial DUP-SERIAL on different jobs
    When a client sends GET /api/assets/lookup?code=DUP-SERIAL
    Then the response status is 409
    And the JSON body ambiguousCount is 2

  Scenario: PUT updates grade status location with change log
    Given an asset in facility GA with valid location in GA
    When a client sends PUT /api/assets/{id} with grade A status Wiped and locationId
    Then the response status is 200
    And the asset change log contains entries for grade status and location

  Scenario: PUT rejects location outside job facility
    Given an asset in facility GA
    And a location reference row parented to facility TX only
    When a client sends PUT /api/assets/{id} with that locationId
    Then the response status is 400

  Scenario: Scan preset applies fixed grade on successful lookup
    Given a preset with fixed grade B and status In Audit
    And an asset with AptoId A0002002
    When the user opens scan page data-testid f8-scan-page
    And the user selects the preset
    And the user submits code A0002002 in data-testid f8-scan-code-input
    Then data-testid f8-scan-result-success is visible within 1 second
    And the session log data-testid f8-scan-session-log shows grade B

  Scenario: Failed lookup shows failure without mutation
    When the user submits code BAD-CODE in data-testid f8-scan-code-input
    Then data-testid f8-scan-result-failure is visible
    And no new change log rows exist for any asset from this submit

  Scenario: Undo restores previous grade after successful scan
    Given an asset with grade U and a preset setting grade A
    When the user applies the preset to the asset via scan
    And the user clicks undo data-testid f8-scan-undo
    Then the asset grade is U again within 2 seconds
