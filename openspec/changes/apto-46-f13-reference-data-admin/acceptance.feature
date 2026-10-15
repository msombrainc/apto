Feature: F13 Reference data admin (apto#46)

  Background:
    Given the apto API and web app are running with apto#46 migration applied
    And seed reference data from Demo2-Plan section F13 is present

  Scenario: List active facilities from reference API
    When a client sends GET /api/reference/facility
    Then the response status is 200
    And the JSON body items includes codes GA TX and CA
    And every item has isActive true

  Scenario: Jobs facilities endpoint matches reference data
    When a client sends GET /api/jobs/facilities
    Then the response status is 200
    And the JSON array includes GA TX and CA

  Scenario: Create location under facility
    Given an active facility id for code GA
    When a client sends POST /api/reference/location with facility parentId code LOC-TEST name "Test Bay" sortOrder 99
    Then the response status is 201
    When a client sends GET /api/reference/location?facilityId={facilityId}
    Then the response body items includes an entry with code LOC-TEST

  Scenario: Reject duplicate facility code
    When a client sends POST /api/reference/facility with code GA name "Duplicate GA" sortOrder 1
    Then the response status is 400
    And the JSON body error mentions code

  Scenario: Asset status requires group
    When a client sends POST /api/reference/asset-status with code TST-STAT name "Test Status" sortOrder 1 without group
    Then the response status is 400

  Scenario: Delete in-use facility deactivates instead
    Given facility GA has at least 1 job referencing FacilityCode GA
    When a client sends DELETE /api/reference/facility/{gaId}
    Then the response status is 200
    And the JSON body item isActive is false

  Scenario: Categories list shows part number counts
    When a client sends GET /api/categories
    Then the response status is 200
    And each item has partNumberCount as a number

  Scenario: Admin user searches reference list
    When the user opens Reference Data admin and selects Facilities
    And the user types "TX" in the search field data-testid ref-admin-search
    Then the list shows at most 50 rows per page
    And the visible rows include code TX

  Scenario: MR gate passes
    When npm run gate:mr executes
    Then the command exits with code 0
