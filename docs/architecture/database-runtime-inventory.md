# Database runtime inventory (Phase 6.0)

**Date:** 2026-07-27  
**Branch:** `dev-Karo`

## Summary

| Process     |                                                 Prisma instances | Connection URL                             |                  Replicas (env) |                        Current pool | Estimated maximum connections |
| ----------- | ---------------------------------------------------------------: | ------------------------------------------ | ------------------------------: | ----------------------------------: | ----------------------------: |
| API         |                      **1** (`PRISMA_TOKEN` via `DatabaseModule`) | `DATABASE_URL` (Neon **pooled**)           | `API_REPLICA_COUNT` (default 1) |       `DB_POOL_MAX_API` (default 5) |            replicas × poolMax |
| Worker      |                               **1** (same Nest module / factory) | `DATABASE_URL` pooled                      |          `WORKER_REPLICA_COUNT` |    `DB_POOL_MAX_WORKER` (default 4) |            replicas × poolMax |
| Scheduler   |                                                            **1** | `DATABASE_URL` pooled                      |       `SCHEDULER_REPLICA_COUNT` | `DB_POOL_MAX_SCHEDULER` (default 2) |            replicas × poolMax |
| Migrations  |                                                   1 (Prisma CLI) | **`DIRECT_URL` only** (`prisma.config.ts`) |                             n/a |                                   1 |                           1–2 |
| Seeds / CLI | 1 per process (`createPrismaClient({ skipBudgetAssert: true })`) | `DATABASE_URL`                             |                             n/a |                        role default |                   short-lived |
| Tests       |                                       in-memory mocks / fixtures | n/a                                        |                             n/a |                                 n/a |                             0 |

## Factories found

| Location                                             | Notes                                                 |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `apps/api/src/database.module.ts`                    | Nest singleton `PRISMA_TOKEN`                         |
| `packages/database/src/client.ts`                    | `createPrismaClient` — pg `Pool` + `PrismaPg` adapter |
| `packages/database/prisma/seed*.ts`, `check-data.ts` | Isolated CLI clients                                  |

**No** `new PrismaClient()` in controllers, BullMQ workers, or request handlers (injected `PRISMA_TOKEN` only).

## Neon / Coolify

| Item                       | Status                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Neon plan connection limit | **UNKNOWN** — set `DB_TOTAL_CONNECTION_BUDGET` to plan limit                                        |
| Pooled endpoint            | `DATABASE_URL` → `*-pooler.neon.tech` (documented in `.env.example`)                                |
| Direct endpoint            | `DIRECT_URL` → migrations only (`prisma.config.ts` `datasource.url`)                                |
| PgBouncer transaction mode | Neon pooler; avoid session features / long idle TX                                                  |
| Coolify replica counts     | Set `API_REPLICA_COUNT` / `WORKER_REPLICA_COUNT` / `SCHEDULER_REPLICA_COUNT` to match Coolify scale |

## Runtime vs migration

```text
Runtime (api|worker|scheduler): DATABASE_URL  → pooled
Migrations / prisma migrate:    DIRECT_URL    → direct
```

Production startup fails if `DB_TOTAL_CONNECTION_BUDGET` unset or planned total exceeds budget.

## `$transaction` volume

~50+ call sites under `apps/api/src` (notifications, drive, credentials, mail, payroll, partners, …). See `docs/architecture/database-transactions.md`.

## Query logging (before Phase 6)

No production query middleware. Phase 6 adds sampled slow-query metrics without SQL parameters.
