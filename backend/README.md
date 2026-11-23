# Karyashala backend

Feature-oriented Express API using TypeScript, PostgreSQL, and Prisma.

## Requirements

- Node.js 20.19 or newer
- pnpm 10
- PostgreSQL for readiness checks and database operations

## Get started

```sh
pnpm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to a PostgreSQL connection string, then run:

```sh
pnpm db:generate
pnpm dev
```

The API listens on `http://localhost:4000` by default. `GET /api/v1/health` is a liveness check; `GET /api/v1/health/ready` also checks the database connection.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the API with watch mode |
| `pnpm build` | Generate Prisma Client and compile TypeScript |
| `pnpm start` | Run the compiled API |
| `pnpm typecheck` | Generate Prisma Client and type-check |
| `pnpm test` | Run backend tests |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Create/apply a development migration |
| `pnpm db:deploy` | Apply committed migrations in deployment |
| `pnpm db:studio` | Open Prisma Studio |

Database migrations are intentionally not run as part of setup.

## Structure

```text
src/
  features/       # API features with their routes and domain logic
  shared/
    config/       # Validated environment configuration
    database/     # Shared Prisma client
    http/         # Cross-feature HTTP errors and middleware
  app.ts          # Express middleware and route composition
  server.ts       # HTTP lifecycle and graceful shutdown
prisma/
  schema.prisma
  migrations/
```

Add each domain as a self-contained feature under `src/features/<feature>/`; keep feature-specific routes, services, and schemas together.
