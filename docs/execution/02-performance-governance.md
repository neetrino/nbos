# Performance-First Governance

## Purpose

Provide a measurable process so each delivery iteration improves or preserves performance.
No feature is considered done without before/after evidence.

## Metrics to track

## API (backend)

- P50 latency
- P95 latency
- P99 latency
- Error rate
- Throughput for critical endpoints

Critical endpoint set:

- `/api/crm/deals`
- `/api/projects`
- `/api/finance/orders`
- `/api/finance/invoices`
- `/api/finance/payments`
- `/api/tasks`

## Web (frontend)

- LCP
- INP
- CLS
- TTFB

Critical pages:

- `/dashboard`
- `/crm/deals`
- `/projects`
- `/finance/invoices`
- `/tasks`

## Performance budget policy

- Any change that worsens P95 API latency by more than 10% requires explicit approval.
- Any change that worsens LCP by more than 10% on critical pages requires mitigation tasks.
- New list endpoints must support pagination and explicit sort.
- New expensive queries must be benchmarked before merge.

## Iteration workflow

1. Capture baseline for touched endpoints/pages before implementation.
2. Implement feature/fix.
3. Capture post-change measurements using same scenario.
4. Compare and record delta.
5. Add mitigation if budget is exceeded.

## Evidence format in PR

Each PR touching critical flows includes:

- Measured scope (which endpoints/pages)
- Before metrics
- After metrics
- Delta and decision
- Follow-up actions (if any)

## Baseline cadence

- Weekly baseline snapshot for all critical endpoints/pages.
- Full baseline before each release increment.
- Keep historical snapshots for regression spotting.

## Tooling guidance (current repo)

- Use targeted unit/integration tests for affected services.
- Use synthetic request scripts or API collection to gather latency numbers.
- For frontend, run representative flows and capture vitals in a consistent environment.

## Stop-ship conditions

Release is blocked when one of the following is true:

- P95 regressions above budget with no approved exception.
- New endpoint without pagination for list data.
- Unbounded query added to critical path.
- Frontend critical path has measurable render regressions with no mitigation plan.
