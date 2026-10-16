Feature: F12 QuickBooks sync queue (apto#47)

  Background:
    Given the apto API and web app are running with apto#47 migration applied
    And QBO HTTP is mocked for integration tests

  Scenario: Account create enqueues customer without inline QBO call
    When a client sends POST /api/accounts with a unique name and code
    Then the response status is 201 within 2 seconds
    And the JSON body qboSyncStatus is pending
    And exactly 1 QboSyncRequest row exists with Operation CreateCustomer and Status Pending
    And no live QBO HTTP request was made during the POST handler

  Scenario: Worker sends oldest pending customer create
    Given a Pending CreateCustomer request created 60 seconds ago
    And a second Pending CreateCustomer request created now
    And QBO mock returns 200 with Customer Id 99
    When the queue worker runs one processing cycle
    Then the older request Status is Sent with QboId 99
    And the newer request Status is still Pending

  Scenario: Failed request after 5 attempts
    Given a Pending request with Attempts 4
    And QBO mock returns 400 with error code 6240
    When the queue worker processes that request
    Then the request Status is Failed
    And LastError contains 6240
    And Attempts is 5

  Scenario: Manual retry resets failed row
    Given a Failed QboSyncRequest with id R1
    When a client sends POST /api/qbo/requests/R1/retry
    Then the response status is 204
    And request R1 has Status Pending and Attempts 0

  Scenario: QBO status when disconnected
    Given no QboConnection row in the database
    When a client sends GET /api/qbo/status
    Then the response status is 200
    And connected is false
    And connectUrl is a non-empty string

  Scenario: List requests with status filter
    Given seed requests with statuses Pending and Failed
    When a client sends GET /api/qbo/requests?status=Failed&pageSize=50
    Then the response status is 200
    And every item in items has status Failed
    And total is greater than or equal to 1

  Scenario: Admin retries from QuickBooks Sync screen
    Given a Failed sync request visible in the queue API
    When the user opens QuickBooks Sync admin data-testid qbo-sync-page
    And the user clicks retry data-testid qbo-sync-retry-{id}
    Then the table row shows status Pending within 15 seconds

  Scenario: CreateInvoice enqueue guard without QboCustomerId
    Given an Account without QboCustomerId
    When a test harness enqueues CreateInvoice for that account
    And the queue worker processes the row
    Then the request Status is Failed
    And LastError mentions customer not synced
