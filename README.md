# SCAD Inventory

An in-progress inventory-management assessment project built with ASP.NET Core,
PostgreSQL, Dapper, and React.

## Current status

The repository contains a clean application scaffold and a PostgreSQL database
foundation. API features, authentication, and the product UI will be added in
small, independently tested slices.

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

## Planned scope

The next slice adds the Dapper/Npgsql connection factory and API database
configuration. Order persistence, refresh tokens, and product or warehouse
update/delete endpoints are intentionally out of scope until the core
requirements are complete.
