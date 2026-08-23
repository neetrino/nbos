# Neon connection strategy (NBOS)

**Audience:** Coolify / ops. No real credentials in this doc.

## Two URLs

| Env            | Used by                                     | Endpoint type               | Example shape                                                                         |
| -------------- | ------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL` | `nbos-api`, `nbos-worker`, `nbos-scheduler` | Neon **pooled** (`-pooler`) | `postgresql://app_user:***@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL`   | Coolify `nbos-migrate` (Prisma CLI) only    | Neon **direct**             | `postgresql://neon_owner:***@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`      |

Runtime processes **must not** use `DIRECT_URL`. Prisma config (`packages/database/prisma.config.ts`) reads `DIRECT_URL` for migrations.

## Role pool defaults

| Process   | Env                     | Default |
| --------- | ----------------------- | ------: |
| API       | `DB_POOL_MAX_API`       |       5 |
| Worker    | `DB_POOL_MAX_WORKER`    |       4 |
| Scheduler | `DB_POOL_MAX_SCHEDULER` |       2 |

Authoritative limit is `pg.Pool({ max })` inside `createPrismaClient`. URL query params (`connection_limit`, …) are aligned for diagnostics.

## Connection budget

```env
DB_TOTAL_CONNECTION_BUDGET=   # required in production — Neon plan max connections
DB_RESERVED_CONNECTIONS=4     # migrations, admin, monitoring, emergency
API_REPLICA_COUNT=1
WORKER_REPLICA_COUNT=1
SCHEDULER_REPLICA_COUNT=1
```

Formula:

```text
planned =
  API_REPLICA_COUNT × DB_POOL_MAX_API
+ WORKER_REPLICA_COUNT × DB_POOL_MAX_WORKER
+ SCHEDULER_REPLICA_COUNT × DB_POOL_MAX_SCHEDULER
+ DB_RESERVED_CONNECTIONS

planned ≤ DB_TOTAL_CONNECTION_BUDGET
```

Print:

```bash
pnpm db:budget
```

Example output:

```text
Database connection budget:
API: 2 × 5 = 10
Worker: 1 × 4 = 4
Scheduler: 1 × 2 = 2
Reserved: 4
Total planned: 20
Budget: 30
Status: OK
```

## Timeouts

```env
DB_POOL_TIMEOUT_SEC=10
DB_CONNECT_TIMEOUT_SEC=10
DB_STATEMENT_TIMEOUT_MS=30000
```

`DB_STATEMENT_TIMEOUT_MS` is applied with `SET statement_timeout` after each pool connect — **not** via URL `options=` (Neon pooler rejects that startup parameter).

## Readiness

```env
DB_READINESS_CACHE_MS=5000
DB_READINESS_TIMEOUT_MS=2000
```

- Liveness (`/health`): no DB
- Readiness (`/health/ready`, worker `/ready`, scheduler `/api/ready`): cached `SELECT 1`

## Observability

```env
DB_QUERY_METRICS_ENABLED=false
DB_SLOW_QUERY_THRESHOLD_MS=500
DB_QUERY_SAMPLE_RATE=0.01
```

Slow / sampled events never include SQL parameters or connection passwords.

## Coolify checklist

1. Set pooled `DATABASE_URL` on api, worker, scheduler.
2. Set `DIRECT_URL` only on `nbos-migrate` (one-shot). Canon: not on api/worker/scheduler. Leftover key on `nbos-api` is not the migration path.
3. Set replica count envs to match Coolify scale.
4. Set `DB_TOTAL_CONNECTION_BUDGET` from Neon dashboard.
5. Deploy worker → scheduler → api (Stage E).
