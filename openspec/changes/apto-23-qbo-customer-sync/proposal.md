# Change: QuickBooks sandbox Customer on Account create (apto#23)

## Why

Week-1 demo requires Account create in AIMS to mirror a Customer in QBO sandbox (FR-17).

## What

- OAuth2 authorize/callback + token refresh persistence (`QboConnection`)
- On `POST /api/accounts`, create QBO Customer when connected; expose sync status on responses
- Mocked HTTP tests (no live QBO in CI)

Related: #23
