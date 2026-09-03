# AI Assistance Disclosure

AI assistance was used throughout this assessment repository to:

- Turn the assessment requirements into small implementation slices.
- Draft and review parameterised Dapper/Npgsql data access.
- Implement and test PostgreSQL transaction and row-locking behavior.
- Implement JWT authentication and warehouse-scoped stock authorization.
- Create the React product workflow and Playwright browser specification.
- Extend the UI with a dashboard, inventory listing, warehouse management,
  and stock-transfer screens, then simplify the visual design across all of
  them.
- Change stock receiving from insert-only to an upsert that adds to an
  existing quantity, with matching API/unit/integration/e2e test updates.
- Extract the transfer arithmetic into a pure, unit-testable calculator.
- Prepare Docker configuration, test infrastructure, and this documentation.

The candidate reviewed the resulting code, retained the deliberately small
architecture, and is responsible for understanding and defending every included
decision. No AI-generated output replaces the real PostgreSQL or HTTP tests.
