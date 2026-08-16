# ADR — BullMQ process roles (API vs Worker)

**Status:** Accepted (Phase 3)  
**Date:** 2026-07-27

## Decision

Split Nest entrypoints:

| Entrypoint     | Module                          | Role                                |
| -------------- | ------------------------------- | ----------------------------------- |
| `main.ts`      | `AppModule`                     | `PROCESS_ROLE=api` (or `all` local) |
| `worker.ts`    | `WorkerAppModule` + health HTTP | `PROCESS_ROLE=worker`               |
| `scheduler.ts` | `SchedulerAppModule` scaffold   | `PROCESS_ROLE=scheduler` (Phase 4)  |

`QueueWorkersModule` owns BullMQ `Worker` providers. Feature modules keep Queue producers only.  
Production forbids `PROCESS_ROLE=all`.

## Redis

Prefer same `REDIS_URL` for queues on this release (no silent queue Redis migration).  
Optional `REDIS_QUEUE_URL` / `REDIS_STATE_URL` / `REDIS_EVENTS_URL` with fallback.

## Rollback

Re-enable workers inside API via previous image or `PROCESS_ROLE=all` only in non-prod; stop dedicated worker to avoid double consumers.
