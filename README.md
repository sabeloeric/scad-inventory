# SCAD Inventory

An in-progress inventory-management assessment project built with ASP.NET Core,
PostgreSQL, Dapper, and React.

## Current status

The repository contains a PostgreSQL database foundation, a configured
Dapper/Npgsql connection factory, and product list/detail/create endpoints with
consistent validation and error responses. Warehouse list/create endpoints are
also implemented. Authentication and the product UI will be added later.
Insert-only initial stock and warehouse-scoped stock data access are also
implemented. Stock transfers use a single PostgreSQL transaction and row-level
locks to update both warehouses atomically.

## Prerequisites

- .NET SDK 10.0.400
- Node.js 24.20.0 and npm 11.19.0
- Docker and Docker Compose (required from the database slice onward)

## Current commands

Run the API:

```bash
dotnet run --project src/Scad.Inventory.Api
```

Run the automated tests:

```bash
dotnet test Scad.Inventory.sln
```

The integration project starts an isolated PostgreSQL Testcontainer and applies
the checked-in schema; Docker must be running.

Run the UI locally:

```bash
cd src/scad-inventory-ui
npm ci
npm run dev
```

Build and lint the UI:

```bash
npm run build
npm run lint
```

## Database setup

Copy the development-only database settings and start PostgreSQL:

```bash
cp .env.example .env
docker compose up -d postgres
```

Configure the API to use that development database before running it:

```bash
export ConnectionStrings__Database='Host=localhost;Port=5432;Database=scad_inventory;Username=scad_inventory;Password=scad_inventory_dev_password'
dotnet run --project src/Scad.Inventory.Api
```

This connection string is development-only. Production configuration must be
provided through the environment or a secret store, never committed settings.

## Implemented API

The following unauthenticated development endpoints are currently available:

```text
GET  /products
GET  /products/{code}
POST /products
GET  /warehouses
POST /warehouses
POST /stock
POST /orders
```

Authentication will protect them when the JWT slice is added.

The container applies `database/001_schema.sql` and `database/002_seed.sql`
when its named volume is created. The seed data contains JHB and CPT warehouses,
product `ABC001`, and stock of 100 and 20 respectively.

Development-only users are `jhb@scad.local` and `cpt@scad.local`. Their shared
password will be documented with the login endpoint when authentication is
implemented; their database values are bcrypt hashes, not plaintext passwords.

To recreate the development database from the scripts, stop and remove its
volume, then start the service again:

```bash
docker compose down -v
docker compose up -d postgres
```

## Transfer concurrency

Transfers use PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) inside one
transaction. Concurrent transfers touching the same stock wait for the lock
holder, so each request validates the latest committed quantity before updating.
This prevents overselling and is straightforward to reason about, at the cost of
serializing transfers for the same stock rows and reducing throughput under
contention. Rows are locked in deterministic warehouse-ID order to reduce
deadlock risk.

The assessment brief scopes stock reads by the authenticated user's warehouse,
but does not explicitly restrict transfer source or destination warehouses. The
API therefore does not add warehouse-scoped write authorization. A production
requirement should make that policy explicit.

## Planned scope

The next slice adds JWT authentication and activates the authorized stock-read
endpoint. Order persistence, refresh tokens, and product or warehouse
update/delete endpoints are intentionally out of scope until the core
requirements are complete.
