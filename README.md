# SCAD Inventory

SCAD Inventory is a compact inventory-management assessment project built with
ASP.NET Core, PostgreSQL, Dapper, and React. It supports products, warehouses,
initial stock, authenticated warehouse-scoped stock reads, and atomic stock
transfers that prevent concurrent overselling.

## Architecture

```text
React + Vite browser UI
        |
        | JSON + JWT bearer token (/api proxy in development)
        v
ASP.NET Core controllers and services
        |
        | Parameterised Dapper/Npgsql SQL
        v
PostgreSQL constraints, transactions, and row locks
```

The API is one deliberately small project. Controllers handle HTTP contracts,
repositories own ordinary SQL, and `StockTransferService` owns the transfer
transaction. Request and response contracts are separate from persistence
models. No ORM is used.

## Implemented scope

- Product list, detail, and create endpoints with normalized codes and duplicate
  handling.
- Warehouse list and create endpoints.
- Insert-only initial stock and product/warehouse stock queries.
- Atomic transfers with deterministic PostgreSQL row locking.
- JWT login backed by seeded bcrypt password hashes.
- SQL-enforced stock visibility for the authenticated user's warehouse.
- Consistent JSON application and validation errors.
- Real PostgreSQL HTTP integration tests using Testcontainers.
- React login, product list, product detail, and product creation flows.
- A Playwright flow covering the UI, API, authentication, and PostgreSQL.
- Docker Compose for the API and PostgreSQL.

## Prerequisites

The repository was verified with:

- .NET SDK 10.0.400
- Node.js 24.20.0 and npm 11.19.0
- Docker 29.7.2 and Docker Compose 5.5.0

Docker must be running for Compose, integration tests, and Playwright. The
Playwright installation also downloads Chromium.

## Quick start with Docker

Copy the development configuration and start the API plus PostgreSQL:

```bash
cp .env.example .env
docker compose up --build
```

The API listens at `http://localhost:5097`. PostgreSQL listens at
`localhost:5432`. The database container applies `database/001_schema.sql` and
`database/002_seed.sql` when its named volume is first created.

To stop the services without deleting data:

```bash
docker compose down
```

To deliberately recreate the development database from the checked-in scripts:

```bash
docker compose down --volumes
docker compose up --build
```

The second command deletes the Compose database volume and all data in it.

## Development login

The seed script creates two development-only accounts:

| Username | Password | Warehouse |
|---|---|---|
| `jhb@scad.local` | `Password123!` | JHB |
| `cpt@scad.local` | `Password123!` | CPT |

Only bcrypt hashes are stored in PostgreSQL. These credentials and the example
JWT key must never be used outside local development.

## Run locally

Start only PostgreSQL:

```bash
cp .env.example .env
docker compose up -d postgres
```

Run the API from the repository root:

```bash
export ConnectionStrings__Database='Host=localhost;Port=5432;Database=scad_inventory;Username=scad_inventory;Password=scad_inventory_dev_password'
export Jwt__Issuer='scad-inventory-api'
export Jwt__Audience='scad-inventory-ui'
export Jwt__SigningKey='development-only-signing-key-change-before-production'
export Jwt__ExpirationMinutes='60'
dotnet run --project src/Scad.Inventory.Api
```

In another terminal, run the UI:

```bash
cd src/scad-inventory-ui
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to
`http://127.0.0.1:5097`. Set `VITE_API_PROXY_TARGET` to override that API target.

The UI keeps the assessment JWT and returned user in local storage so the demo
survives a refresh. Production browser authentication requires a fuller threat
model and would commonly use a secure HttpOnly cookie rather than exposing a
bearer token to browser JavaScript.

## OpenAPI

The development OpenAPI document is available at:

```text
http://localhost:5097/openapi/v1.json
```

The global authorization policy protects it, like every endpoint except login.
Fetch it with a bearer token using the same `Authorization` header shown below.

## API examples

Login and copy the returned `accessToken`:

```bash
curl --request POST http://localhost:5097/auth/login \
  --header 'Content-Type: application/json' \
  --data '{"username":"jhb@scad.local","password":"Password123!"}'

export TOKEN='<accessToken from the login response>'
```

Create and list products:

```bash
curl --request POST http://localhost:5097/products \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"code":"ABC002","description":"Replacement widget"}'

curl http://localhost:5097/products \
  --header "Authorization: Bearer $TOKEN"

curl http://localhost:5097/products/ABC002 \
  --header "Authorization: Bearer $TOKEN"
```

Create and list warehouses:

```bash
curl --request POST http://localhost:5097/warehouses \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"code":"DBN","name":"Durban Warehouse"}'

curl http://localhost:5097/warehouses \
  --header "Authorization: Bearer $TOKEN"
```

Add initial stock and query visible stock:

```bash
curl --request POST http://localhost:5097/stock \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"productCode":"ABC002","warehouseCode":"JHB","quantity":100}'

curl 'http://localhost:5097/stock?productCode=ABC002' \
  --header "Authorization: Bearer $TOKEN"

curl 'http://localhost:5097/stock?warehouseCode=JHB' \
  --header "Authorization: Bearer $TOKEN"
```

Transfer stock:

```bash
curl --request POST http://localhost:5097/orders \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"productCode":"ABC001","sourceWarehouseCode":"JHB","destinationWarehouseCode":"CPT","quantity":20}'
```

Expected application errors use this safe shape:

```json
{
  "code": "PRODUCT_NOT_FOUND",
  "message": "Product 'MISSING' was not found."
}
```

Validation responses additionally contain a camel-cased `errors` dictionary.

## Automated tests

Run all .NET unit and integration tests from the repository root:

```bash
dotnet test Scad.Inventory.sln
```

The integration tests start isolated PostgreSQL Testcontainers, apply the same
checked-in schema and seed scripts, boot the real API with
`WebApplicationFactory`, and send HTTP requests through authentication and
routing. They prove database constraints, transaction wiring, rollback,
serialization, stock authorization, and concurrent locking. Docker must be
running; they never use the normal development database.

The focused unit tests prove validation and connection-factory behavior. They do
not pretend that mocked SQL proves PostgreSQL transactions or row locks; those
behaviors are deliberately covered by real-database integration tests.

Build and lint the UI:

```bash
cd src/scad-inventory-ui
npm ci
npm run lint
npm run build
```

Run the browser test:

```bash
cd tests/e2e
npm ci
npx playwright install chromium
npm test
```

Playwright starts a dedicated Compose project on API port `5098` and PostgreSQL
port `55432`, starts Vite on port `5174`, creates a uniquely coded product, and
removes its test containers and database volume when finished.

## Transfer concurrency and integrity

Transfers use one PostgreSQL connection and transaction at the default
`READ COMMITTED` isolation level. The service resolves the product and both
warehouses, creates a missing destination stock row at zero, and locks both stock
rows using `SELECT ... FOR UPDATE`. Rows are locked in warehouse-ID order in
either transfer direction.

Concurrent transfers touching the same stock wait for the lock holder. Each
request therefore validates the latest committed source quantity before
updating. With source stock of 10, two simultaneous transfers of 8 cannot both
succeed: one succeeds, the other receives `400 INSUFFICIENT_STOCK`, and total
inventory remains 10.

This strategy is straightforward to explain and prevents overselling, at the
cost of serializing transfers for the same stock rows and reducing throughput
under contention. Deterministic ordering reduces deadlock risk but does not
claim to eliminate every possible database deadlock.

PostgreSQL also enforces non-negative quantities and unique product, warehouse,
and stock keys. Request validation improves feedback; database constraints remain
the final concurrency-safe integrity boundary.

## Warehouse authorization

The JWT contains the user's warehouse ID and code. Every stock-read repository
query requires the authenticated warehouse ID and includes
`stock.warehouse_id = @AuthorizedWarehouseId` in SQL before optional filters. A
JHB-linked user filtering only by product still sees only JHB stock, and an
explicit request for CPT receives `403 FORBIDDEN`.

Filtering in React would not be a security boundary because a caller can bypass
the UI and call the API directly. The authorization predicate must remain in
data access. A future tenant-aware design would apply the same rule to every
relevant key, constraint, index, and query, potentially backed by PostgreSQL row
level security as defense in depth.

The assessment brief scopes stock-read visibility but does not say that a user
may transfer only from their linked warehouse. Transfers are therefore not
warehouse-scoped writes. Production requirements should make that policy
explicit before changing the behavior.

## Intentional omissions

The following work is outside the assessed core and was intentionally omitted:

- Order-history persistence.
- Product and warehouse update/delete endpoints.
- Pagination and advanced search.
- Registration, refresh tokens, password reset, and a full identity system.
- Multi-tenancy, message brokers, and transactional outbox publishing.
- An ORM, generic repository, CQRS, MediatR, or microservices.
- UI containerization; Compose contains the required API and PostgreSQL only.

If reliable post-transfer event publication becomes necessary, the intended
extension is a transactional outbox row written in the stock transaction, then
published asynchronously to idempotent consumers.

## AI assistance

AI materially assisted with implementation and documentation. The disclosure in
[`AI_USAGE.md`](AI_USAGE.md) records the affected areas. Every generated line is
kept small enough to review and explain during the assessment.
