# Payroll audit — test report

**Audit date:** 2026-09-26. **Execution:** read-only targeted Vitest run against mocked dependencies. Command:

```bash
pnpm exec vitest run \
  apps/api/src/modules/compensation-profiles/compensation-profiles.service.test.ts \
  apps/api/src/modules/compensation-profiles/resolve-active-compensation-profile.test.ts \
  apps/api/src/modules/payroll-runs/payroll-runs.service.test.ts \
  apps/api/src/modules/payroll-runs/payroll-run-status-transitions.test.ts \
  apps/api/src/modules/payroll-runs/payroll-salary-line-ledger-sync.test.ts \
  apps/api/src/modules/bonus/sales-bonus-accrual.service.test.ts \
  apps/api/src/modules/bonus/bonus-release.service.test.ts
```

**Result:** 7 test files passed; **45 tests passed, 0 failed**; reported duration 2.21 seconds. Vitest emitted a Vite configuration compatibility warning about ESM syntax loaded as CommonJS; it did not fail this run. No production or persistent database, migrations, browser, external payment service or queue was used. All seven files exercise mocked Prisma/service data. The following list accounts for every reported passing test.

## Tests that passed

### Compensation profile activation — 1

Source: `apps/api/src/modules/compensation-profiles/compensation-profiles.service.test.ts:5-59`.

1. Copies profile salary onto Employee when a draft becomes active.

### Compensation profile month resolver — 1

Source: `apps/api/src/modules/compensation-profiles/resolve-active-compensation-profile.test.ts:4-25`.

2. Queries an `ACTIVE` profile overlapping the payroll month.

### Payroll run service — 13

Source: `apps/api/src/modules/payroll-runs/payroll-runs.service.test.ts:24-278`.

3. Returns paginated run envelope.
4. Passes payroll month range to the list query.
5. Adds materialized expense-line count.
6. Returns counts and decimal string totals from aggregates.
7. Returns negative remaining total if paid aggregate exceeds payable aggregate (behavior asserted, not proof this is acceptable data).
8. Sorts status rows from `DRAFT` through `CLOSED`.
9. Returns empty Salary Board grid with no matching employees.
10. Rejects lookup of a missing payroll run.
11. Builds journal from durable timestamps.
12. Rejects an invalid payroll month.
13. Rejects a duplicate payroll month.
14. Does not materialize matrix drafts on `DRAFT → REVIEW`.
15. Materializes matrix drafts on `REVIEW → APPROVED`.

### Payroll status transitions — 5

Source: `apps/api/src/modules/payroll-runs/payroll-run-status-transitions.test.ts:5-23`.

16. Allows `DRAFT → REVIEW`.
17. Allows `REVIEW → APPROVED`.
18. Allows `REVIEW → DRAFT`.
19. Rejects `DRAFT → APPROVED`.
20. Rejects transitions out of `CLOSED`.

### Salary expense-ledger synchronization — 4

Source: `apps/api/src/modules/payroll-runs/payroll-salary-line-ledger-sync.test.ts:48-100`.

21. Does nothing for an expense not linked to a salary line.
22. Sets `PARTIALLY_PAID` and remaining balance after partial payment.
23. Sets `PAID` after full payment.
24. Sets `APPROVED` after all payments are removed. **This does not assert reversal of bonus release `PAID` state** ([D-04](04-FUNCTIONAL-DEFECTS.md)).

### Sales bonus accrual — 7

Source: `apps/api/src/modules/bonus/sales-bonus-accrual.service.test.ts:21-310`.

25. Does nothing for an invoice that is not `PAID`.
26. Accrues Seller Sales bonus on a fully paid Classic invoice.
27. Skips Classic accrual when a slotted Sales bonus already exists.
28. Uses first-month policy on first paid subscription invoice.
29. Uses one month's base from a multi-month first subscription invoice.
30. Skips recurring accrual when invoice/employee rows exist.
31. Accrues recurring subscription bonus on later paid invoices.

### Bonus release service — 14

Source: `apps/api/src/modules/bonus/bonus-release.service.test.ts:29-205`.

32. Rejects release listing for a missing entry.
33. Returns paginated releases.
34. Rejects `EARLY` release without reason.
35. Rejects `OVER_FUNDING` without supplied approver ID.
36. Rejects an unknown payroll run.
37. Rejects a release above the planned entry cap.
38. Creates a release and resynchronizes pool.
39. Rejects a patch when release belongs to another entry.
40. Rejects patching an `INCLUDED_IN_PAYROLL` release.
41. Rejects unchanged amount.
42. Rejects empty correction reason.
43. Rejects an updated total above entry cap.
44. Requires supplied approver ID for `OVER_FUNDING` patch. **This does not authenticate that approver** ([D-06](04-FUNCTIONAL-DEFECTS.md)).
45. Changes `AUTO` to `CORRECTION` and resynchronizes pool on patch.

## What those results establish

The tested functions obey these assertions with test fixtures and mocks. They do **not** establish database constraints on a deployed schema, route authorization, concurrent transaction behavior, browser usability, current pay rates, historical salary selection, payment reversal integrity, marketing/support calculations, or an approved-to-paid reconciliation of real money. A passing suite therefore cannot certify payroll readiness.

## Existing broader automated coverage observed but not rerun

Other relevant test files exist for KPI payout, cap/carry, allocation matrix, delivery v2 calculations, product bonus pools, Wallet and reports (examples: `apps/api/src/modules/payroll-runs/sales-kpi-payroll-payout.test.ts`, `payroll-bonus-cap.test.ts`, `payroll-allocation-matrix.service.test.ts`, `apps/api/src/modules/bonus/product-bonus-pool-auto-release.test.ts`, `apps/api/src/modules/employees/employee-wallet.service.test.ts`). They were not part of this targeted execution. Their presence is coverage evidence, not a pass result for this audit.

## Missing verification cases, ordered by payroll risk

1. **Authorization:** low-privilege employee reads another employee's salary or calls payroll/bonus writes; Finance/CEO positive access; object-level scope; spoofed approver IDs (D-01, D-06).
2. **Temporal salary:** two profile versions across month boundaries, future activation, retro payroll, concurrent activation, fallback and terminated/rehired employee (D-02).
3. **Reversals:** fully/partially paid client invoice removed after Sales bonus/release/payroll; expense payout deleted after release marked paid; refund after employee payment (D-03, D-04).
4. **Rate history:** policy effective date versus payment date, delayed entry, equal-date ties and policy edit history (D-05).
5. **Failure recovery:** accrual DB failure after payment is saved, idempotent retry and reconciliation report (D-07).
6. **Money rules:** currency mismatch, decimal/rounding boundaries, zero-base cap, absent KPI result, cap carry and duplicate bonus across orders; Product Owner decisions first where policy is unclear.
7. **Workflow:** staged employee setup → Sales/Delivery facts → bonus release → matrix review → approval → expense creation → partial/full payment → Wallet/report; change facts after approval; concurrent approval and payment attempts.
8. **Delivery rollout:** real published norms/rates and dev migrations in an isolated environment, legacy/v2 coexistence, full Product and Extension completion paths, mobile/desktop Finance and Wallet QA. `TODO.md:126-146` also records these open checks.

## Checks not run

No live/staging database tests, API authorization tests, production queries, migrations, browser QA, full suite, typecheck or lint were run. The audit made no code changes, so code formatting/build checks were not applicable to its deliverable. New markdown was checked separately after authoring; see the closing verification in the audit summary.
