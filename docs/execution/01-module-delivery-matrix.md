# Module Delivery Matrix

## Purpose

Execution order and Definition of Done for implementation blocks.

Canonical roadmap:

```text
docs/NBOS/00-Implementation-Roadmap.md
```

This document is an operational supplement. If it conflicts with the NBOS roadmap, the roadmap wins.

## Delivery order

| Order | Module block                           | Why first                                      | Depends on |
| ----- | -------------------------------------- | ---------------------------------------------- | ---------- |
| 1     | CRM and Deals integrity                | Source of downstream entities and states       | -          |
| 2     | Projects Hub consistency               | Consumes CRM outputs and drives delivery model | 1          |
| 3     | Finance correctness                    | Critical money flow and status propagation     | 1, 2       |
| 4     | Tasks and Support reliability          | Operational execution and SLA behaviors        | 1, 2       |
| 5     | Credentials and Drive security         | Sensitive data and file lifecycle hardening    | 2, 3       |
| 6     | Messenger, Calendar, Dashboards polish | Productivity and visibility layer              | 1-5        |
| 7     | Integrations and migration readiness   | External dependencies and cutover risk         | 1-6        |

## Exit criteria by block

## 1) CRM and Deals integrity

- Stage transitions are deterministic and guarded by required fields.
- `WON` side effects are validated with tests for product and extension paths.
- Repeated status updates do not trigger duplicate side effects.
- API negative paths return stable validation errors.

## 2) Projects Hub consistency

- Project, product, and extension states have no contradictory combinations.
- Product-centric flows map correctly to API entities.
- Cross-links (`projectId`, `productId`, `extensionId`) are consistent.
- UI counters and backend stats align.

## 3) Finance correctness

- `Order -> Invoice -> Payment` status sync is deterministic.
- Partial and full payment transitions are tested.
- Billing/scheduler operations are idempotent.
- Dashboard totals match backend aggregation rules.

## 4) Tasks and Support reliability

- Auto-task generation is stable and deduplicated.
- Support SLA transitions are predictable and tested.
- Board/list views do not drift from backend state.
- Failure scenarios are observable via logs and errors.

## 5) Credentials and Drive security

- Access boundaries are enforced and test-covered.
- Audit events exist for every sensitive read/write action.
- File upload/download metadata and ownership are consistent.
- Error responses do not leak sensitive information.

## 6) Messenger, Calendar, Dashboards polish

- Core user journeys complete without dead ends.
- Navigation and cross-module references are coherent.
- High-traffic pages keep acceptable response/render times.
- Data freshness expectations are explicit and consistent.

## 7) Integrations and migration readiness

- Integration contracts are documented and versioned.
- Migration mapping coverage for required entities is complete.
- Dry-run migration procedure is executable.
- Rollback strategy is documented and validated.

## Gate before moving to next block

Every block must pass all of:

1. `pnpm lint`, `pnpm typecheck`, and targeted tests pass.
2. No unresolved P1/P2 defects remain in the block scope.
3. Documentation is updated in `docs/DEVELOPMENT_PLAN.md`.
4. Performance guardrails for changed endpoints/pages are checked.
