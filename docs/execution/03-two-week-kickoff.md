# Two-Week Kickoff Execution

## Goal

Execute the first two weeks from the startup plan with explicit deliverables,
acceptance criteria, and visible progress.

## Week 1 - CRM transition invariants

## Scope

- Close deal transition invariants.
- Finalize stage gate required fields.
- Cover `Deal -> Product/Order` side effects with tests.

## Task list

- [x] Prevent duplicate side effects on repeated `WON` status update.
- [x] Add unit tests for `DealWonHandler` on PRODUCT and EXTENSION paths.
- [x] Keep stage gate tests green for cumulative and type-specific requirements.
- [ ] Add cross-module invariant test for `WON -> order/invoice` chain (next step).

## Evidence

- `apps/api/src/modules/crm/deals/deals.service.ts` updated with idempotent status check.
- `apps/api/src/modules/crm/deals/deals.service.test.ts` updated with unchanged-status test.
- `apps/api/src/modules/crm/deals/deal-won.handler.test.ts` added.

## Acceptance criteria

- Repeated `WON` update does not run side effects twice.
- PRODUCT won path creates project/product when needed.
- EXTENSION won path links extension to existing product and project.

## Week 2 - Projects and Finance consistency

## Scope

- Align Projects Hub and Finance transitions.
- Stabilize billing/payment transitions.
- Capture first performance baseline for critical pages and endpoints.

## Task list

- [ ] Validate `Order -> Invoice -> Payment` transition scenarios.
- [ ] Add missing negative-path tests for payment/order synchronization.
- [ ] Run baseline measurements for critical API routes.
- [ ] Run baseline measurements for critical web pages.
- [ ] Record baseline result in this document and `docs/DEVELOPMENT_PLAN.md`.

## Acceptance criteria

- Finance transitions are deterministic under partial/full payment paths.
- Scheduler/billing behavior is idempotent in repeated runs.
- Baseline metrics exist for agreed critical endpoints and pages.

## Handoff after Week 2

When Week 2 is complete:

1. Update `docs/DEVELOPMENT_PLAN.md` progress log.
2. Start module block 2 from `docs/execution/01-module-delivery-matrix.md`.
