# SCAD Inventory

An in-progress inventory-management assessment project built with ASP.NET Core,
PostgreSQL, Dapper, and React.

## Current status

The repository currently contains a clean application scaffold. PostgreSQL
schema, API features, authentication, and the product UI will be added in
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

## Planned scope

The next slice adds the PostgreSQL schema, deterministic development seed data,
and database container setup. Order persistence, refresh tokens, and product or
warehouse update/delete endpoints are intentionally out of scope until the core
requirements are complete.
