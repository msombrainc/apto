# Change: Week1-01 core data model (EF Core + SQL Server)

**Ticket:** apto#4  
**Status:** In progress

## Why

Week-1 vertical slice needs a versioned SQL Server schema for Account → Job → Asset before CRUD APIs and UI land in later tickets.

## What

- EF Core 8 `AptoDbContext` with entities: Account, Job, Asset, PartNumber, Category (FR-1 minimal slice).
- Initial migration + apply on API startup (non-Testing).
- Docker Compose already wires `sqlserver` + `api` with `ConnectionStrings__Default`.

## Out of scope

HTTP CRUD, React, QuickBooks, SLA color calculations.
