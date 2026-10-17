Feature: F2 Account detail and edit (apto#51)

  Background:
    Given the apto API and web app are running with apto#51 migration applied
    And QBO HTTP is mocked or queue worker is stubbed for integration tests

  Scenario: Get account by id returns status and settings
    Given an account A1 exists with status Active and aptoPercentage 15
    When a client sends GET /api/accounts/A1
    Then the response status is 200
    And the JSON body status is Active
    And settings.aptoPercentage is 15

  Scenario: Update account writes change log and enqueues QBO on billing address
    Given an account A1 with name "Acme Corp" and empty billing address
    When a client sends PUT /api/accounts/A1 with settings.billingAddress.line1 "100 Main St"
    Then the response status is 200 within 2 seconds
    And an AccountChangeLog row exists for field settings.billingAddress.line1
    And a Pending QboSyncRequest exists for UpdateCustomer linked to A1
    And no live QBO HTTP occurred during the PUT handler

  Scenario: Update account does not enqueue QBO when only rules toggle
    Given an account A1 synced to QBO with stable name and billing address
    When a client sends PUT /api/accounts/A1 with settings.rules.recycleOnly true
    Then the response status is 200
    And settings.rules.recycleOnly is true in the response
    And no new QboSyncRequest was created for this PUT

  Scenario: List accounts filters by status
    Given accounts "Active Co" with status Active and "Old Co" with status Inactive
    When a client sends GET /api/accounts?status=Active
    Then every item in the response has status Active
    And "Old Co" is not in the results

  Scenario: Duplicate account code rejected
    Given accounts with codes "AAA" and "BBB"
    When a client sends PUT /api/accounts/BBB with code "AAA"
    Then the response status is 409
    And the JSON error mentions code

  Scenario: Change log filter by field
    Given account A1 with at least two change log rows for different fields
    When a client sends GET /api/accounts/A1/changes?field=Name
    Then the response status is 200
    And every entry has fieldName Name

  Scenario: Manual QBO sync from account
    Given an account A1 with QBO configured
    When a client sends POST /api/accounts/A1/qbo-sync
    Then the response status is 202
    And the JSON body contains requestId

  Scenario: Account detail page shows QBO panel and saves
    Given the user is logged in as demo
    And an account A1 exists
    When the user navigates to /accounts/A1
    Then element data-testid="f2-account-detail-page" is visible
    And element data-testid="f2-account-qbo-panel" is visible
    When the user sets Input SLA days to 45 and saves
    Then a success message is shown
    And GET /api/accounts/A1 returns slaReceivingDays 45

  Scenario: Accounts search links to detail and shows status column
    Given the user is on /accounts
    When the user sets status filter to Both
    Then the accounts table shows a Status column
    When the user clicks the first account name link
    Then the browser URL matches /accounts/

  Scenario: SLA labels use Input Settlement Sales on accounts UI
    Given the user is on /accounts
    Then SLA column headers or legends include Input
    And do not show only "Receiving" as the sole label for the first SLA segment
