# SCAD Inventory Skills Test - Coding Agent Guide

## 1. Purpose of this file

This file is the working specification for AI coding agents contributing to this repository. It combines the SCAD Software Skills Test requirements with the design decisions already made for the implementation.

The goal is a small, correct, explainable Senior-tier submission that can be completed and demonstrated under the assessment's four-hour time box. Correct transfer behaviour, database integrity, concurrency, meaningful tests, and a clear README matter more than feature count or visual polish.

When this file and an agent's default preferences conflict, follow this file. When this file and the official assessment brief conflict, follow the official assessment brief and update this file to record the correction.

## 2. Rules for coding agents

Before changing code:

1. Read this file and the repository README completely.
2. Inspect the existing solution, tests, database scripts, Docker files, and UI before proposing changes.
3. Determine whether this is a greenfield repository or the SCAD starter repository.
4. If it is the starter repository, match its existing patterns even when another pattern might be preferable. Record objections or trade-offs in the README instead of rewriting the starter architecture.
5. State the next small implementation slice and its acceptance criteria.

While changing code:

- Keep the solution simple enough for the candidate to explain and defend line by line.
- Use small, reviewable changes and preserve existing working behaviour.
- Do not introduce an ORM. Entity Framework Core, Hibernate, and ServiceStack OrmLite are prohibited.
- Use parameterised Dapper or raw ADO.NET queries only.
- Never implement warehouse authorization only in the UI or by filtering rows after loading them from PostgreSQL.
- Do not use mocked or in-memory data as a substitute for the required PostgreSQL HTTP integration test.
- Do not add speculative abstractions, generic repositories, CQRS, MediatR, event sourcing, refresh tokens, or microservices unless the core submission is already complete and there is a demonstrated need.
- Do not invent business rules that are absent from the brief. Explicitly document assumptions instead.
- Do not persist orders initially. Order history is optional and low priority.
- Do not commit or push unless the user explicitly asks. Suggest a Conventional Commit message after each complete slice.

After changing code:

1. Run the narrowest relevant tests first.
2. Run formatting/build checks for the affected project.
3. Run the complete automated test suite before declaring a feature complete.
4. Explain what the tests prove and what they do not prove.
5. Update the README when setup, behaviour, assumptions, trade-offs, or known omissions change.
6. Report files changed, commands run, test results, and the next highest-priority task.

## 3. Assessment constraints and target tier

Target: **Senior**.

Hard constraints:

| Concern | Required decision |
|---|---|
| Backend | .NET / C# RESTful API |
| Database | PostgreSQL, not SQLite, SQL Server, or an in-memory replacement |
| Data access | Dapper plus Npgsql with hand-written parameterised SQL |
| ORM | None |
| Database setup | Checked-in DDL that can create the database from the repository |
| Core resources | Products, warehouses, stock, and stock transfers/orders |
| Transfer | Atomic source decrement and destination increment |
| Concurrency | Implemented strategy that prevents overselling |
| Unit tests | Business logic, including successful transfer, insufficient stock, and duplicate code |
| Integration test | At least one real PostgreSQL test through the real HTTP path |
| UI | Product list, product detail, create product, validation, loading, empty, and error states |
| Authentication | API and UI |
| Authorization | A user sees stock only for their linked warehouse; enforce in SQL/data access |
| Containers | Docker Compose for API and PostgreSQL |
| Browser test | At least one Playwright end-to-end specification |
| Documentation | Setup, run/test instructions, example calls, concurrency explanation, omissions |
| Git history | Conventional Commits with one logical change per commit |

The official brief allows AI assistance. Every generated line must remain understandable and defensible by the candidate. Keep a short `AI_USAGE.md` or an AI-assistance section in the README listing where AI materially contributed.

## 4. Locked technical decisions

| Concern | Decision |
|---|---|
| API style | ASP.NET Core controllers in one API project |
| Runtime | Use the latest stable .NET SDK already installed and supported by the repository; do not upgrade mid-task without need |
| Data access | Dapper and Npgsql |
| Connection creation | `IDbConnectionFactory` with `NpgsqlConnectionFactory` |
| Database naming | PostgreSQL snake_case tables and columns |
| Quantities | C# `int`; PostgreSQL `INTEGER` |
| Stock identity | Composite uniqueness on `(product_id, warehouse_id)` |
| Negative inventory | PostgreSQL `CHECK (quantity >= 0)` plus application validation |
| Transfer transaction | One connection and one database transaction |
| Concurrency | PostgreSQL row locks using `SELECT ... FOR UPDATE` |
| Deadlock mitigation | Lock source/destination stock rows in deterministic warehouse-ID order |
| Destination without stock | Create a zero-quantity row inside the transaction, then lock/update it |
| Isolation | PostgreSQL default `READ COMMITTED` plus explicit row locks |
| Authentication | JWT bearer tokens and seeded local users |
| Authorization | Authenticated warehouse ID included in stock SQL predicates |
| Errors | Global exception handling and one consistent JSON error contract |
| Integration testing | `WebApplicationFactory` plus Testcontainers for PostgreSQL |
| UI | React + TypeScript + Vite; React is explicitly acceptable even though Vue/Nuxt is preferred by SCAD |
| Browser testing | Playwright |
| Schema management | Reusable checked-in SQL scripts; no ORM migrations |
| Order persistence | Omit unless all required work is complete |

## 5. Intended repository structure

Prefer a single API project with folders over several class-library projects. This keeps ceremony low while preserving separation of concerns.

```text
.
|-- AGENTS.md
|-- README.md
|-- AI_USAGE.md                         # optional; README section is also acceptable
|-- compose.yaml
|-- .env.example
|-- database/
|   |-- 001_schema.sql
|   `-- 002_seed.sql
|-- src/
|   |-- Scad.Inventory.Api/
|   |   |-- Auth/
|   |   |   |-- CurrentUser.cs
|   |   |   `-- JwtTokenService.cs
|   |   |-- Contracts/
|   |   |   |-- Auth/
|   |   |   |-- Products/
|   |   |   |-- Warehouses/
|   |   |   |-- Stock/
|   |   |   `-- Orders/
|   |   |-- Controllers/
|   |   |   |-- AuthController.cs
|   |   |   |-- ProductsController.cs
|   |   |   |-- WarehousesController.cs
|   |   |   |-- StockController.cs
|   |   |   `-- OrdersController.cs
|   |   |-- Data/
|   |   |   |-- IDbConnectionFactory.cs
|   |   |   |-- NpgsqlConnectionFactory.cs
|   |   |   |-- ProductRepository.cs
|   |   |   |-- WarehouseRepository.cs
|   |   |   |-- StockRepository.cs
|   |   |   `-- UserRepository.cs
|   |   |-- Errors/
|   |   |   |-- ApiExceptionHandler.cs
|   |   |   `-- AppException.cs
|   |   |-- Models/
|   |   |   |-- Product.cs
|   |   |   |-- Warehouse.cs
|   |   |   |-- Stock.cs
|   |   |   `-- User.cs
|   |   |-- Services/
|   |   |   |-- AuthService.cs
|   |   |   `-- StockTransferService.cs
|   |   |-- Program.cs
|   |   `-- Scad.Inventory.Api.csproj
|   `-- scad-inventory-ui/
|       |-- src/
|       |   |-- api/
|       |   |-- auth/
|       |   |-- components/
|       |   |-- pages/
|       |   `-- routes/
|       `-- package.json
|-- tests/
|   |-- Scad.Inventory.UnitTests/
|   |-- Scad.Inventory.IntegrationTests/
|   `-- e2e/
`-- Scad.Inventory.sln
```
If the starter repository uses a different structure, keep its conventions and adapt the responsibilities rather than reorganizing it.

## 6. Domain and database design

### Products

Required fields:

- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `code TEXT NOT NULL`
- `description TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Unique constraint named `uq_products_code` on `code`

Product codes are trimmed and normalized to uppercase at the API boundary. Do not invent a restrictive code regex.

### Warehouses

Required fields:

- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `code TEXT NOT NULL`
- `name TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Unique constraint named `uq_warehouses_code` on `code`

Warehouse codes are trimmed and normalized to uppercase at the API boundary.

### Stock

Required fields:

- `product_id BIGINT NOT NULL REFERENCES products(id)`
- `warehouse_id BIGINT NOT NULL REFERENCES warehouses(id)`
- `quantity INTEGER NOT NULL CHECK (quantity >= 0)`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Primary key or unique constraint on `(product_id, warehouse_id)`

Add indexes that support product and warehouse stock queries. Do not add an independent stock ID unless it materially simplifies the existing starter pattern.

### Users

For the Senior requirement, use a small local users table:

- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `username TEXT NOT NULL UNIQUE`
- `password_hash TEXT NOT NULL`
- `warehouse_id BIGINT NOT NULL REFERENCES warehouses(id)`

Seed at least one user per demo warehouse. Never store plaintext passwords. Seeded development credentials must be clearly marked as development-only in the README.

### Database scripts

- `database/001_schema.sql` is the single schema source used by local setup, Docker PostgreSQL initialization, and integration tests.
- `database/002_seed.sql` creates demo warehouses/users and minimal optional product data.
- Scripts should be deterministic on a clean database. Idempotency is helpful but not required if the documented workflow recreates the database.

## 7. API conventions

- JSON requests and responses.
- ISO-8601 UTC timestamps when timestamps are exposed.
- Business identifiers (`productCode`, `warehouseCode`) are used in external contracts; internal IDs stay internal.
- Collection endpoints return `200 OK` with `[]` when no records match.
- All endpoints require authentication except `POST /auth/login`.
- Request DTOs and response DTOs must be separate from database models.
- Use async I/O where it is useful. Do not add `async` around CPU-only work.

### Error shape

Expected application errors use this shape:

```json
{
  "code": "PRODUCT_NOT_FOUND",
  "message": "Product 'ABC001' was not found."
}
```

Validation errors may include field details:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "The request is invalid.",
  "errors": {
    "quantity": ["Quantity must be greater than zero."]
  }
}
```

Use global ASP.NET Core exception handling (`IExceptionHandler` or equivalent). Do not repeat controller-level `try/catch` blocks. Do not expose exception details, SQL text, connection strings, password hashes, or PostgreSQL error messages.

### Error/status mapping

| Condition | HTTP | Error code |
|---|---:|---|
| Invalid request shape or value | 400 | `VALIDATION_ERROR` |
| Same source and destination | 400 | `SELF_TRANSFER_NOT_ALLOWED` |
| Insufficient or absent source stock | 400 | `INSUFFICIENT_STOCK` |
| Invalid credentials or missing token | 401 | `INVALID_CREDENTIALS` / standard unauthorized response |
| Querying another warehouse's stock | 403 | `FORBIDDEN` |
| Unknown product | 404 | `PRODUCT_NOT_FOUND` |
| Unknown warehouse | 404 | `WAREHOUSE_NOT_FOUND` |
| Duplicate product code | 409 | `DUPLICATE_PRODUCT_CODE` |
| Duplicate warehouse code | 409 | `DUPLICATE_WAREHOUSE_CODE` |
| Initial stock already exists | 409 | `STOCK_ALREADY_EXISTS` |
| Unexpected server/database failure | 500 | `INTERNAL_ERROR` |

Important: the SCAD brief explicitly requires `400 Bad Request` for insufficient stock. Do not change it to `409`, even though `409` can be defended in other APIs.

Map PostgreSQL unique violations by named constraint, not by parsing human-readable error text.

## 8. Endpoint contracts

### `POST /auth/login`

Request:

```json
{
  "username": "jhb@scad.local",
  "password": "Password123!"
}
```

Success: `200 OK`

```json
{
  "accessToken": "...",
  "expiresAt": "2026-09-01T18:30:00Z",
  "user": {
    "username": "jhb@scad.local",
    "warehouseCode": "JHB"
  }
}
```

Failure: `401 Unauthorized` with `INVALID_CREDENTIALS`. Do not reveal whether the username exists. JWT claims should include `sub`, username, `warehouse_id`, and `warehouse_code`. Refresh tokens, registration, logout, and password reset are out of scope.

### `GET /products`

- Authentication required.
- Returns `200 OK` and an array ordered consistently, preferably by code.
- Empty data returns `200 []`.

Example item:

```json
{
  "code": "ABC001",
  "description": "Widget"
}
```

### `GET /products/{code}`

- Required for the UI detail view.
- Normalize the route code.
- Returns `200 OK` with the product or `404 PRODUCT_NOT_FOUND`.

### `POST /products`

Request:

```json
{
  "code": "ABC001",
  "description": "Widget"
}
```

Rules:

- Code and description are required after trimming.
- Normalize code to uppercase.
- Success: `201 Created`, response is the created product, and `Location` should point to `/products/{code}`.
- Duplicate normalized code: `409 DUPLICATE_PRODUCT_CODE`.

### `GET /warehouses`

- Authentication required.
- Returns `200 OK` and an array, or `200 []` when empty.

Example item:

```json
{
  "code": "JHB",
  "name": "Johannesburg Warehouse"
}
```

### `POST /warehouses`

Request:

```json
{
  "code": "JHB",
  "name": "Johannesburg Warehouse"
}
```

Rules mirror product creation. Success is `201 Created`; duplicate normalized code is `409 DUPLICATE_WAREHOUSE_CODE`.

### `POST /stock`

Adds initial stock; it is not an adjustment or upsert endpoint.

Request:

```json
{
  "productCode": "ABC001",
  "warehouseCode": "JHB",
  "quantity": 100
}
```

Rules:

- All codes are required and normalized.
- Quantity must be an integer greater than zero.
- Unknown product or warehouse returns `404`.
- An existing `(product, warehouse)` stock row returns `409 STOCK_ALREADY_EXISTS`.
- Success returns `201 Created` with product code, warehouse code, and quantity.

### `GET /stock`

Supported queries:

```text
GET /stock?productCode=ABC001
GET /stock?warehouseCode=JHB
GET /stock?productCode=ABC001&warehouseCode=JHB
```

The official brief requires product-based and warehouse-based queries. Supporting both filters together is a small convenience.

Example response item:

```json
{
  "productCode": "ABC001",
  "productDescription": "Widget",
  "warehouseCode": "JHB",
  "warehouseName": "Johannesburg Warehouse",
  "quantity": 100
}
```

Senior authorization rules:

- A JHB-linked user receives only JHB stock, including when filtering only by product.
- A JHB-linked user explicitly requesting `warehouseCode=CPT` receives `403 FORBIDDEN`.
- The repository SQL must always include an authorized warehouse predicate such as `stock.warehouse_id = @AuthorizedWarehouseId`.
- Never fetch all warehouses and filter in C#.
- The UI may hide other warehouse options for usability, but that is not a security boundary.

### `POST /orders`

Transfers stock. It does not persist an order-history resource in the initial solution.

Request:

```json
{
  "productCode": "ABC001",
  "sourceWarehouseCode": "JHB",
  "destinationWarehouseCode": "CPT",
  "quantity": 20
}
```

Validation order:

1. Before acquiring locks, validate required codes, `quantity > 0`, and source different from destination.
2. In the transaction, resolve the product, source warehouse, and destination warehouse. Return `404` for unknown codes.
3. Ensure the destination stock row exists with quantity zero, using conflict-safe insertion.
4. Lock both relevant stock rows in deterministic warehouse-ID order.
5. Treat a missing source stock row as zero stock.
6. Check source quantity after locks are acquired.
7. On insufficient stock, roll back and return `400 INSUFFICIENT_STOCK` with a useful explanation.
8. Decrement the source and increment the destination using the same connection and transaction.
9. Commit only after both updates succeed.

Success: `200 OK`

```json
{
  "productCode": "ABC001",
  "quantityTransferred": 20,
  "source": {
    "warehouseCode": "JHB",
    "remainingQuantity": 80
  },
  "destination": {
    "warehouseCode": "CPT",
    "quantity": 40
  }
}
```

The brief scopes read visibility by warehouse but does not explicitly restrict which warehouses a user may use in a transfer. Do not silently add warehouse-scoped write authorization. Record this as an assumption in the README and explain that production requirements should clarify it.

## 9. Transfer transaction and concurrency algorithm

The transfer service owns the transaction boundary. Repository methods used in the transfer must accept and use the same open connection and transaction.

Conceptual flow:

```text
Open Npgsql connection
Begin transaction (READ COMMITTED)
Resolve product and both warehouses
Ensure destination stock row exists at zero
Select both stock rows ordered by warehouse_id FOR UPDATE
Read locked source quantity
Reject and roll back if source quantity is insufficient
Update source quantity
Update destination quantity
Commit
Return resulting quantities
```

The lock query should acquire rows in deterministic order regardless of transfer direction. This reduces deadlock risk for simultaneous `A -> B` and `B -> A` transfers.

The concurrency strategy must prevent this failure:

```text
Source starts at 10
Transfer A requests 8
Transfer B requests 8 at the same time
Both must not succeed
```

Expected result: one request succeeds, the other returns `400 INSUFFICIENT_STOCK`, source ends at 2, destination increases total 8, and total inventory remains 10.

README trade-off paragraph to preserve in substance:

> Transfers use PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) inside one transaction. Concurrent transfers touching the same stock wait for the lock holder, so each request validates the latest committed quantity before updating. This prevents overselling and is straightforward to reason about, at the cost of serializing transfers for the same stock rows and reducing throughput under contention. Rows are locked in deterministic warehouse-ID order to reduce deadlock risk.

Do not use an unlocked read followed by an application-side check and write. That has a race condition.

## 10. Backend responsibilities by file

### `Program.cs`

- Register controllers, JSON conventions, Swagger/OpenAPI, authentication, authorization, global exception handling, repositories, services, and the connection factory.
- Read `ConnectionStrings:Database` and JWT configuration from configuration/environment.
- Expose `public partial class Program` if needed by `WebApplicationFactory`.
- Apply authentication consistently to protected endpoints.
- Do not hide schema creation in application startup unless the starter repository already does so.

### `IDbConnectionFactory.cs` and `NpgsqlConnectionFactory.cs`

- Centralize construction of `NpgsqlConnection` instances.
- Repositories should not repeatedly parse configuration.
- Return a new connection per operation; the caller owns disposal.

### Models and contracts

- Persistence models contain internal IDs and database fields.
- Requests contain only client-settable fields.
- Responses expose stable business fields, not password hashes or internal IDs.
- Use DataAnnotations for straightforward request-shape validation if already supported.
- Keep cross-field business validation in the service.

### Product and warehouse repositories/controllers

- Use parameterised SQL.
- Normalize at the API/service boundary.
- Let database unique constraints provide the final concurrency-safe duplicate guarantee.
- Translate named unique constraint violations to useful `409` errors.
- Keep controllers thin.

### Stock repository/controller

- Initial stock creation is insert-only.
- All read queries accept `authorizedWarehouseId`.
- Stock visibility filtering is present in SQL.
- Query filters are optional, parameterised, and combined safely.

### `StockTransferService.cs`

- Own validation that source and destination differ.
- Own connection and transaction lifetime.
- Resolve entities, create destination row, lock rows, validate locked source, update both, commit/rollback, and map the result.
- Keep transfer-specific SQL here initially if it remains readable. Extract a narrowly scoped `StockTransferRepository` only if the service becomes difficult to understand.

### Authentication files

- Verify password hashes with a standard password hasher.
- Generate short-lived JWTs with user/warehouse claims.
- `CurrentUser` reads and validates claims centrally.
- Do not trust warehouse IDs supplied by the client for stock visibility.

### Exception handling

- `AppException` or focused subclasses carry status, code, and safe message.
- `ApiExceptionHandler` serializes the consistent error response.
- Log unexpected failures with correlation/context, then return a generic `500` body.

## 11. Testing strategy

Meaningful real-database HTTP tests are more valuable here than a large mocked unit-test count.

### Unit tests

Create focused tests for business rules that do not require PostgreSQL:

- Zero quantity is rejected.
- Negative quantity is rejected.
- Self-transfer is rejected.
- Successful transfer behaviour is covered where the design permits meaningful isolation.
- Insufficient stock behaviour is covered.
- Duplicate product code behaviour is covered at the appropriate layer.

Do not mock every SQL call simply to inflate coverage. A unit test with mocked data access does not prove SQL correctness, constraints, transaction wiring, PostgreSQL locking, routing, serialization, authentication middleware, or actual HTTP status mapping.

### Integration test infrastructure

- Use xUnit or NUnit consistently with the repository.
- Start a real PostgreSQL container using Testcontainers.
- Apply `database/001_schema.sql` and the necessary seed data.
- Boot the real ASP.NET Core app with `WebApplicationFactory` and the container connection string.
- Send real HTTP requests with authentication.
- Isolate test data per test or reset it deterministically.
- Do not point tests at the developer's normal local database.

### Required high-value integration tests

1. **Duplicate product**: first `POST /products` returns `201`; same normalized code returns `409` through the real database constraint.
2. **Initial stock**: create/seed product and warehouse, post quantity, then query and verify the value.
3. **Successful transfer**: with JHB 100 and CPT 20, transfer 30; assert JHB 70, CPT 50, and total inventory remains 120.
4. **Insufficient stock**: failed transfer returns `400`, neither destination nor source is partially changed, and total stock remains unchanged.
5. **Concurrent oversell**: with a source of 10, send two simultaneous transfers of 8 to different destinations; assert exactly one `200`, exactly one `400`, source 2, destination total increase 8, and conserved total stock.
6. **Warehouse visibility**: JHB user querying a product sees JHB stock and never CPT stock.
7. **Direct unauthorized query**: JHB user requesting `warehouseCode=CPT` receives `403`.
8. **Authentication smoke tests**: valid login returns JWT, invalid credentials return `401`, and protected endpoint without JWT returns `401`.

Optional only after the above: many concurrent transfers, opposite-direction transfer/deadlock testing, rollback fault injection, extra CRUD cases, and performance testing.

### Playwright E2E

Create one stable browser flow:

```text
Open login page
Log in with seeded development user
Navigate to products
Create a uniquely coded product
Observe server-backed success/list update
Open the product detail view
Verify its code and description
```

The test should prove UI, API, authentication, and database integration. Use accessible labels or stable `data-testid` attributes sparingly. Avoid brittle CSS selectors and fixed sleeps.

## 12. UI plan

Use React, TypeScript, Vite, React Router, and a small API client. Prefer platform APIs and minimal dependencies. CSS polish is low priority.

Routes:

```text
/login
/products
/products/new
/products/:code
```

The product create form may be embedded in the list page if that saves time while preserving the required behaviour.

Suggested source responsibilities:

```text
src/api/client.ts       base URL, JSON, JWT header, safe error parsing
src/api/auth.ts         login request
src/api/products.ts     list, get, create product
src/auth/AuthProvider   token/user state and protected navigation
src/pages/LoginPage
src/pages/ProductsPage
src/pages/ProductDetailPage
src/pages/NewProductPage
```

Every data page must visibly handle:

- Loading.
- Successful data.
- Empty data.
- API/network error with retry where useful.

Every form must handle:

- Idle state.
- Submitting/disabled state.
- Client-side required-field feedback.
- Server validation feedback.
- Duplicate-code `409` shown in or near the relevant field.
- Successful completion.

Store the token only as simply as the time-boxed assessment needs. Note in the README that production browser auth would require a more thorough threat model and might prefer a secure HttpOnly cookie. Do not spend core implementation time building refresh-token infrastructure.

## 13. Docker and configuration

`compose.yaml` must run at least:

- PostgreSQL.
- ASP.NET Core API.

The UI may run locally for development or be added to Compose only after the Senior requirements are complete.

Configuration principles:

- Commit `.env.example`, never real secrets or a populated `.env`.
- Use environment overrides for database and JWT settings.
- Use development-only credentials and clearly label them.
- Add health checks where they make Compose startup dependable, but do not overbuild orchestration.
- Ensure database schema/seed application is documented and repeatable.

Expected local workflow should be close to:

```bash
docker compose up --build
dotnet test
npm install
npm run dev
npx playwright test
```

Adapt commands to the actual repository and document exact working commands in the README.

## 14. README definition

The README is part of the submission, not cleanup. It must include:

1. Short project overview.
2. Implemented Senior requirements and known omissions.
3. Prerequisites.
4. Environment/configuration setup.
5. Database setup.
6. One-command Docker setup.
7. Local API and UI commands.
8. Test commands for unit, integration, and Playwright tests.
9. Seeded development login details.
10. Swagger/OpenAPI URL.
11. Example curl calls for login, product, warehouse, initial stock, stock query, and transfer.
12. Concurrency strategy and its cost.
13. Warehouse authorization explanation, including why UI-only filtering is insecure.
14. Assumptions, especially transfer write authorization.
15. What was intentionally left out and why.
16. AI assistance disclosure.
17. A brief architecture description or compact diagram.

The README must allow an assessor to run the repository without asking the candidate for missing steps.

## 15. Implementation order

Work in this sequence unless the existing repository changes the dependency order:

1. Inspect starter/greenfield state and record exact SDK/tool versions.
2. Create solution and API project if absent.
3. Add PostgreSQL container and schema script.
4. Implement the Npgsql connection factory.
5. Implement products with validation, duplicate handling, and focused tests.
6. Implement warehouses with validation and duplicate handling.
7. Implement initial stock and authorized stock query signatures.
8. Implement atomic transfer service.
9. Add successful, insufficient-stock, and real PostgreSQL HTTP integration tests.
10. Add concurrent oversell integration test.
11. Add JWT login/current-user support.
12. Enforce warehouse stock visibility in SQL and add authorization tests.
13. Complete API + PostgreSQL Docker Compose.
14. Add React login, product list, detail, and create flow with all states.
15. Add one Playwright flow.
16. Finish README and AI disclosure.
17. Run a clean-clone-style setup, full test suite, and demonstration rehearsal.

Authentication is implemented later in the list to protect the critical transfer work, but authorization must be designed into stock repository signatures from the beginning. Do not first build an unscoped `GetStockAsync` that later requires a broad rewrite.

## 16. Priority and cut line

If time is constrained, prioritize in this order:

1. Transfer logic, edge cases, and proving tests.
2. Validation and useful error responses.
3. Implemented concurrency strategy and README explanation.
4. Real PostgreSQL HTTP integration test.
5. README setup and omissions.
6. UI product list/detail.
7. UI create/validation/states.
8. Authentication.
9. Docker Compose.
10. Playwright, pagination, order history, and extras.

For a Senior submission, plan to complete every tier requirement. This ordering defines what to protect first, not permission to ignore Senior requirements without documenting the time-box outcome.

## 17. Definition of done

### Products

- Schema and named unique constraint exist.
- List, detail, and create endpoints work.
- Code normalization and required validation work.
- Duplicate normalized code returns useful `409` JSON.
- Automated tests pass.
- UI list, detail, and create behaviours work.

### Warehouses

- Schema and named unique constraint exist.
- List and create endpoints work.
- Duplicate normalized code returns useful `409` JSON.
- Automated tests pass.

### Stock

- Initial stock accepts only positive integers.
- Unknown product/warehouse and duplicate stock are handled.
- Product and warehouse queries work.
- SQL always scopes visibility to the authenticated warehouse.
- Cross-warehouse query receives `403`.
- Real PostgreSQL authorization tests pass.

### Transfers

- Required fields and positive quantity are validated.
- Self-transfer and unknown codes are rejected.
- Destination may begin without a stock row.
- Source cannot oversell.
- Both quantity changes are atomic.
- Relevant rows are locked in deterministic order.
- Total stock is conserved.
- Successful, insufficient, and concurrent integration tests pass.

### Submission

- API and database run with documented commands.
- Unit, integration, and E2E commands are documented and passing.
- UI has loading, empty, error, submitting, validation, and duplicate states.
- README explains concurrency, authorization, assumptions, setup, and omissions.
- No secrets are committed.
- Conventional Commit history is clear.
- Candidate can demonstrate and explain every important decision.

## 18. Non-goals until all required work is complete

- Order history.
- Product/warehouse update and delete endpoints.
- Pagination and advanced search.
- Multi-tenancy implementation.
- Message broker integration or an outbox implementation.
- Refresh tokens, registration, password reset, or full identity management.
- Generic repository or unit-of-work frameworks.
- CQRS/MediatR/event sourcing.
- Kubernetes or cloud deployment.
- Elaborate design system or CSS animation.
- Broad performance optimization without measurements.

These may be discussed in the interview. They should not displace assessed requirements.

## 19. Interview reasoning to preserve

The candidate should be able to explain:

- Why an unlocked read/check/write can oversell and how `FOR UPDATE` changes the sequence.
- Why deterministic lock ordering reduces, but does not universally eliminate, deadlock concerns.
- Why database constraints remain necessary even with request validation.
- Why source and destination updates must share one connection and transaction.
- Why a mocked unit test does not prove PostgreSQL SQL, transactions, locks, routing, or serialization.
- Why authorization belongs in the data-access predicate rather than the UI.
- How tenant scoping would extend the same principle: tenant ID in every relevant key, constraint, index, and SQL predicate, ideally with defense in depth such as PostgreSQL row-level security.
- How to publish a `StockTransferred` event only after a successful transaction: use a transactional outbox record written in the same database transaction, then publish asynchronously and mark it processed with idempotent consumers.
- Why a team might ban an ORM: explicit SQL, predictable performance, easier query-level reasoning, and avoidance of hidden behaviour; and the cost: more manual mapping, SQL maintenance, and database coupling.

Do not implement the event broker, transactional outbox, or multi-tenancy unless requested after the assessed features are complete.

## 20. Suggested Conventional Commit sequence

Use these only when the corresponding slice is actually complete:

```text
chore: scaffold inventory solution
feat(database): add inventory schema and seed data
feat(products): add product endpoints
feat(warehouses): add warehouse endpoints
feat(stock): add initial stock and scoped queries
feat(orders): add atomic stock transfer
test(orders): cover PostgreSQL transfer concurrency
feat(auth): add JWT authentication and warehouse scoping
chore(docker): compose API and PostgreSQL
feat(ui): add authenticated product workflow
test(e2e): cover product creation flow
docs: add setup decisions and known omissions
```

One logical change per commit. Do not bundle the whole assessment into `initial commit` or `final changes`.

## 21. First instruction for a new coding-agent session

Use this prompt after placing this file at the repository root:

```text
Read AGENTS.md and README.md completely, then inspect the repository without changing files. Tell me whether it is greenfield or a SCAD starter repository, compare the current state with the Senior definition of done, and propose the next smallest vertical slice. Do not implement anything until you have shown the gap analysis and the exact tests that will prove that slice.
```
