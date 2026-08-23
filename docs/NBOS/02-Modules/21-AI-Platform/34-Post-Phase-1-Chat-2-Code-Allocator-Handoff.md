# Post-Phase-1 Chat 2 Handoff — Atomic Human-Readable Codes

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.
> This chat did **not** commit.

## Milestone

NEW CHAT 2 of root `ai-modul-steps.md` / Workstream 2 of
`32-Post-Phase-1-Technical-Debt-Plan.md`. Branch `sipan`.

Goal: close AI Cleanup C25. Every confirmed production human-readable code
series uses one authoritative PostgreSQL allocator (`entity_code_counters`).

Do **not** start NEW CHAT 3 (Drive artifact lifecycle) from this handoff.

NEW CHAT 1 prerequisite: committed as `2aae557d` (`fix(tasks): create Tasks only through the owned create port`), independently verified **PASS WITH DEBTS**. Tasks ownership was not reopened.

## Inventory

Repository search used:

```text
generateCode / generate*Code
orderBy: { code: 'desc' }
padStart(4, '0')
startsWith: `{PREFIX}-{year}-`
.nextNum / count + 1 / _max + 1 on code
.invoice.create / .lead.create / .deal.create / .order.create /
.subscription.create / .project.create / .supportTicket.create
```

Classified **out of scope** (not a year-scoped business-code series):

| Pattern                                               | Why excluded                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `Task` `T-`                                           | Already on `allocateTaskCode` / `TASK` (C23). Not rewritten. |
| `NotificationRule.code`                               | Catalog / preference identifiers, not a sequential series.   |
| `SystemListOption.code`                               | Catalog key, unique with `listKey`.                          |
| `sortOrder` / `versionNumber` `_max + 1`              | Ordering / versioning, not human-readable business codes.    |
| Seed / demo fixtures (`seed.ts`, `seed-rich-demo.ts`) | Not production writers.                                      |

### Confirmed affected series

All seven use `{PREFIX}-{year}-{NNNN}` with a unique `code` column and a January year reset. None is a global (non-year) series.

| Series         | Prefix | Scope            | Unique                 | Writers (all moved)                                                                                                                   | Previous generator                     | Rollout     |
| -------------- | ------ | ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------- |
| Invoice        | `INV-` | `INVOICE`        | `invoices.code`        | `InvoicesService.create`, `BillingService` (year from target date), `createDealDepositInvoice`, `createFinanceFromPartnerServiceTerm` | `findFirst(orderBy code desc)` + parse | Write pause |
| Support Ticket | `TKT-` | `SUPPORT_TICKET` | `support_tickets.code` | `SupportService.create`                                                                                                               | same                                   | Write pause |
| Deal           | `D-`   | `DEAL`           | `deals.code`           | `DealsService.create`, `LeadConversionService`, `SupportService.createExtensionDeal`, `DealWonHandler` maintenance Deal               | same                                   | Write pause |
| Lead           | `L-`   | `LEAD`           | `leads.code`           | `LeadsService.create`, `AtsLeadIngestService`, `MetaLeadIngestService`                                                                | same                                   | Write pause |
| Order          | `ORD-` | `ORDER`          | `orders.code`          | `OrdersService.create`, `createOrderForDeal`                                                                                          | same                                   | Write pause |
| Subscription   | `SUB-` | `SUBSCRIPTION`   | `subscriptions.code`   | `SubscriptionsService.create`, `DealWonHandler`, partner service-term finance                                                         | same                                   | Write pause |
| Project        | `P-`   | `PROJECT`        | `projects.code`        | `ProjectsService.create`, `DealWonHandler.ensureProject`, `ensureProjectForDeal`                                                      | same                                   | Write pause |

No additional production `MAX/latest/count + 1` business-code generator was found.

ATS and Meta previously allocated inside an interactive transaction. They now reserve on the committed `PrismaClient` (C26): the counter row is not held for the rest of ingest.

## Architecture decision

```text
Module create operation
→ allocate{Series}Code (named scope)
→ entity_code_counters upsert
→ format {PREFIX}-{year}-{NNNN}
→ entity insert
```

Shared primitive stays `allocateEntityCodeNumber`. Formatting stays the existing year-prefixed shape. Modules keep entity ownership; only the next-number primitive is shared.

`BillingService` still uses the target billing date's year, not `new Date()` at allocate time.

Malformed historical codes are ignored by both the parser and the seed SQL (`null` / no row), never guessed.

## Files

Added:

- `apps/api/src/common/utils/entity-code-series.ts`
- `apps/api/src/common/utils/entity-code-series.test.ts`
- `apps/api/src/common/utils/entity-code-seed.ts`
- `apps/api/src/common/utils/entity-code-seed.test.ts`
- `apps/api/src/common/utils/entity-code-series.int.test.ts`
- `apps/api/src/test-utils/stub-entity-code-allocation.ts`
- `packages/database/prisma/migrations/20260823120000_seed_sibling_entity_code_counters/migration.sql`
- this handoff

Changed:

- `apps/api/src/common/utils/entity-code-counter.ts` (`ENTITY_CODE_SCOPE` entries)
- all writers listed above
- matching unit tests
- `packages/database/prisma/schema/system.prisma` (comment only)
- C25 + module cleanup registers + Workstream 2 status

## Migrations

`20260823120000_seed_sibling_entity_code_counters` — additive `INSERT` of new `(scope, year)` rows. No schema change. Table already exists. **Not applied to production.**

Seed is numeric (`CAST` of the digit suffix), grouped by year, filtered to `^{prefix}-\d{4}-\d+$`. Malformed rows are skipped. A year with only malformed codes is not seeded and starts at 1 on first allocation.

`next_value` is `INTEGER`. Preflight before apply: no conforming code may have a suffix of 10+ digits.

```sql
SELECT "code" FROM "invoices" WHERE "code" ~ '^INV-\d{4}-\d{10,}$' LIMIT 1;
-- repeat for support_tickets/TKT, deals/D, leads/L, orders/ORD,
-- subscriptions/SUB, projects/P
```

Empty result — continue. Non-empty — do not apply; reconcile first.

After apply, for each scope/year:

```sql
SELECT c."scope", c."year", c."next_value",
       MAX(CAST(SUBSTRING(t."code" FROM '^INV-\d{4}-(\d+)$') AS INTEGER))
FROM "entity_code_counters" c
JOIN "invoices" t ON t."code" LIKE 'INV-' || c."year" || '-%'
WHERE c."scope" = 'INVOICE'
GROUP BY 1, 2, 3;
```

`next_value` must be ≥ the numeric max. Repeat per series.

## Mixed-version rollout

**Write pause required. Rolling deploy is unsafe.**

Old writers still compute `MAX(table)+1`. One such insert after the seed leaves the counter behind the table; the next counter allocation then collides with no concurrency. This is the same C23 lesson.

1. Preflight suffix-length queries above.
2. Stop every process that creates Invoice, Support Ticket, Deal, Lead, Order, Subscription, or Project (API, worker, scheduler, ATS/Meta ingest).
3. Apply the seed migration and verify counters.
4. Deploy the new binaries to all instances.
5. Resume writes.

Rollback needs the same write pause. After rollback, do not leave new binaries allocating from the counter while old binaries still write `MAX+1`.

Tasks `T-` is already on the counter and is unchanged.

## Tests

- `entity-code-series.test.ts` — pad, `9999` → `10000`, parse, malformed reject, lexicographic trap.
- `entity-code-seed.test.ts` — numeric max, malformed ignored, series list.
- `entity-code-series.int.test.ts` — migration SQL contains every sibling seed; opt-in real DB: concurrent named allocators, invoice `9999` → `10000`, numeric seed `VALUES` query, parallel `LeadsService` + `SupportService` creates.
- Unit tests for every moved writer now stub `$queryRaw` instead of `findFirst(code desc)`.

## Remaining debts

Out of this chat on purpose:

- K209 / C24 / NEW CHAT 3 — Drive artifact lifecycle;
- Tasks C8 — blueprints vs automation rules;
- Recurring machine actor (Chat 1 debt);
- seed fixtures still write fixed codes (not production);
- production apply of this seed migration.

## Verifier scope

Exact searches:

```text
rg 'orderBy:\\s*\\{\\s*code:\\s*.desc' --glob '*.ts'
rg 'padStart\\(4,\\s*.0' --glob '*.ts'
rg 'generateCode|generateInvoiceCode|generateLeadCode|generateDealCode' --glob '*.ts'
rg 'allocateInvoiceCode|allocateSupportTicketCode|allocateDealCode|allocateLeadCode|allocateOrderCode|allocateSubscriptionCode|allocateProjectCode' --glob '*.ts'
```

Allowed leftover `padStart(4, '0')`: `task-code-generation.ts` only.

Allowed leftover `orderBy code desc`: none in production sources.

Every series in the inventory table must have exactly one allocate function and no `findFirst` code generator.

Also confirm:

1. Tasks ownership / `allocateTaskCode` unchanged;
2. Drive lifecycle untouched;
3. Billing still uses the target date year for `INV-`;
4. ATS/Meta reserve on the committed client, not the ingest transaction;
5. C25 is code-complete, not fully closed, until real-DB evidence exists;
6. NEW CHAT 3 was not started.

## Executor checks (not a substitute for independent verification)

- Targeted writer + parser/seed tests: 20 files / 259 passed (after moving Subscription allocate after billing validation). 4 real-DB cases skipped because `AI_PLATFORM_DB_TEST_URL` is unset.
- `entity-code-series.int.test.ts` migration-SQL assertion: passed.
- `pnpm test:regression`: 22 files / 285 passed.
- eslint on changed API source files: passed.
- `@nbos/api` `tsc --noEmit` with `NODE_OPTIONS=--max-old-space-size=8192`: passed.
- Opt-in real-DB concurrency / seed `VALUES` / parallel Lead+Support creates: **not run** — env unset. Verifier should run `entity-code-series.int.test.ts` against a disposable database.
- Production build: not run.
- No commit.

## Independent verification

**Verifier:** NEW CHAT 2 independent verifier (fresh chat). Product code was not modified.

**Verdict: PASS WITH DEBTS**

C25 is closed. Every confirmed production year-scoped business-code series now has one authoritative `entity_code_counters` allocator; no leftover production `MAX/latest/count + 1` writer was found. Remaining items are out of this milestone’s scope. Rollout is write-pause, not rolling-deploy — that claim is honest, not invented.

### 1. Branch / HEAD / worktree

| Fact     | Value                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------- |
| Branch   | `sipan`                                                                                             |
| HEAD     | `4d988963` `Merge branches 'sipan' and 'sipan' of https://github.com/neetrino/nbos into sipan`      |
| Chat 1   | committed `2aae557d` (`fix(tasks): create Tasks only through the owned create port`) — not reopened |
| Worktree | `/Users/user/{} Development/1. Production/nbos`                                                     |
| Commit   | **not created** (uncommitted Chat 2 work, as claimed)                                               |
| Remote   | `sipan` up to date with `origin/sipan`                                                              |

Uncommitted surface matches the handoff: sibling allocators + seed migration + writer conversions + tests + C25 / module cleanup / this handoff. Drive / NEW CHAT 3 files were not touched. `task-code-generation.ts` / `TaskCreationService` were not rewritten.

### 2. Independent generator inventory

Re-ran the handoff searches plus `generate*Code`, `split('-')[2]`, `startsWith: \`PREFIX-${year}\``, unique Prisma `code`columns,`.lead/.invoice/.deal/.order/.subscription/.project/.supportTicket.create`, `createMany`, and raw `INSERT INTO` those tables.

Unique sequential `code` columns in schema: Task, Invoice, SupportTicket, Deal, Lead, Order, Subscription, Project. Plus catalog keys (`NotificationRule.code`, `SystemListOption` `[listKey, code]`). Payment / Expense have no sequential code.

`git grep` on **committed HEAD** found every `generate*Code` / `orderBy: { code: 'desc' }` production writer. All of them are in this worktree diff and now call a named `allocate*Code`. Current worktree: no leftover `generate*Code`, no production `orderBy code desc`.

| Pattern                                                    | Verifier classification                                                                                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Task` `T-` / `allocateTaskCode`                           | Already C23. Unchanged.                                                                                                                                              |
| Invoice `INV-`                                             | `INVOICE`. Writers: `InvoicesService`, `BillingService` (year from `targetDate ?? new Date()`), `createDealDepositInvoice`, `createFinanceFromPartnerServiceTerm`.   |
| Support Ticket `TKT-`                                      | `SUPPORT_TICKET`. Writer: `SupportService.create`.                                                                                                                   |
| Deal `D-`                                                  | `DEAL`. Writers: `DealsService`, `LeadConversionService`, `SupportService.createExtensionDeal`, `DealWonHandler` maintenance Deal.                                   |
| Lead `L-`                                                  | `LEAD`. Writers: `LeadsService`, `AtsLeadIngestService` (reserve before `$transaction`), `MetaLeadIngestService` (`allocateLeadCode(this.prisma)` inside ingest tx). |
| Order `ORD-`                                               | `ORDER`. Writers: `OrdersService`, `createOrderForDeal`.                                                                                                             |
| Subscription `SUB-`                                        | `SUBSCRIPTION`. Writers: `SubscriptionsService` (allocate after billing validation), `DealWonHandler`, partner service-term finance.                                 |
| Project `P-`                                               | `PROJECT`. Writers: `ProjectsService`, `DealWonHandler.ensureProject`, `ensureProjectForDeal`.                                                                       |
| `NotificationRule` / `SystemListOption`                    | Catalog keys, not a year series.                                                                                                                                     |
| `sortOrder` / `versionNumber` `_max + 1`                   | Ordering / versioning.                                                                                                                                               |
| `seed.ts` / `seed-rich-demo.ts`                            | Fixtures. `padStart(4, '0')` leftover here is allowed.                                                                                                               |
| `formatYearScopedEntityCode` / `formatTaskCode` `padStart` | Formatter only, not a table-MAX reader.                                                                                                                              |

No additional production `MAX/latest/count + 1` business-code generator was found. All writers of each series moved together. One `ENTITY_CODE_SCOPE` / allocate function per series. No mixed `counter + MAX(table)` authority in current sources.

### 3–10. Seed, boundary, concurrency, gaps vs duplicates

- Seed SQL and `seedCountersFromCodes` take `MAX(CAST(suffix AS INTEGER))` grouped by year, filtered to `^{prefix}-\d{4}-\d+$`. Malformed rows are skipped. A year with only malformed codes is not seeded and starts at 1.
- Disposable-DB seed replay with `INV-2026-9999`, `INV-2026-10000`, `INV-2026-foo`, `INV-2026-0998`, `INV-26-0001`, `not-a-code`, `D-2026-0001`, `INV-2025-0042` produced `INVOICE/2025=42` and `INVOICE/2026=10000`. Lexicographic max would have preferred `9999`.
- Read-only inspect of designated non-prod Neon `ep-restless-tooth` (not production `ep-sweet-dew`): sibling counters **absent** (seed not applied, correctly). No 10+ digit suffixes. TASK counters match numeric max (`2024=40`, `2025=15`, `2026=831`). Project has 219 `BX-P-*` malformed rows and 6 conforming `P-2026-*`; seed would set `PROJECT/2026=6` and ignore `BX-P-*`.
- `9999 → 10000`: unit formatter + real-DB invoice allocate after `next_value=9999` → `INV-2996-10000`.
- Concurrent allocate: 20 parallel calls per sibling series, plus `entity-code-counter.int.test.ts` 40-way primitive — all distinct. Parallel `LeadsService.create` × 8 and `SupportService.create` × 8 on empty disposable DB: 8 unique `L-` and 8 unique `TKT-`.
- Gaps after reserve-then-failed-insert remain the documented contract. Duplicates are blocked by the unique `code` column plus the atomic upsert. Mixed old `MAX+1` + new counter **does** collide — write pause is required.

### 11. Rollout

Honest. C23 already proved one `MAX(table)` insert after seed leaves the counter behind. Same here. Sequence write-pause → apply seed → deploy all new binaries → resume is the only safe cutover. Rolling deploy is unsafe. Seed `INSERT` has no `ON CONFLICT`; applying it after new binaries have already created sibling counter rows fails closed.

**Do not apply the seed to a live shared database while old writers are still running.** This verifier applied the seed only to a disposable local Postgres.

### 12. Business behavior

Prefixes and January year reset are unchanged (`{PREFIX}-{year}-{NNNN}`, pad is a minimum width). Billing still uses the target billing date’s year (`allocateInvoiceCode(this.prisma, now.getFullYear())` where `now = targetDate ?? new Date()`); unit test asserts `INV-2025-0001`. ATS/Meta reserve on the committed client (C26). Tasks ownership and Drive lifecycle were not changed.

### 13. C25 closeability

Yes. Inventory is complete, writers moved together, seed is numeric and fail-closed on malformed rows, concurrency and `9999 → 10000` have real-DB evidence, rollout is documented honestly. C25 can be marked FIXED.

### Checks run

| Check                                                                                                                                                           | Result                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted writer + parser/seed tests                                                                                                                             | **18 files / 251 passed**, 4 skipped until real-DB env set                                                                                               |
| `entity-code-series.int.test.ts` + `entity-code-counter.int.test.ts` on disposable local Postgres (`db push` schema; `AI_PLATFORM_DB_TEST_URL=127.0.0.1:54333`) | **2 files / 7 passed** (concurrent sibling allocators, `9999 → 10000`, VALUES seed, parallel Lead+Support, 40-way primitive)                             |
| Seed SQL apply + numeric replay on disposable                                                                                                                   | **passed** — empty apply `INSERT 0`; replay `2025=42`, `2026=10000`                                                                                      |
| Independent repository generator search                                                                                                                         | **passed** — HEAD writers all converted; no leftover production MAX+1                                                                                    |
| Read-only non-prod Neon inspect (`ep-restless-tooth`)                                                                                                           | **passed** — preflight 10+ digits empty; sibling counters absent; TASK in sync                                                                           |
| `pnpm test:regression`                                                                                                                                          | **22 files / 285 passed**                                                                                                                                |
| eslint on changed API source files                                                                                                                              | **passed**                                                                                                                                               |
| `@nbos/api` `tsc --noEmit` with `NODE_OPTIONS=--max-old-space-size=8192`                                                                                        | **passed**                                                                                                                                               |
| `prisma migrate deploy` onto empty disposable                                                                                                                   | **failed** on historical `TaskStatusEnum` `NEW` (pre-existing enum-in-same-transaction). Schema applied via `db push` instead. Not a C25 product defect. |
| Production build                                                                                                                                                | **not run**                                                                                                                                              |
| Seed / product migrations on Neon or production                                                                                                                 | **not applied**                                                                                                                                          |

### Out-of-scope debts (do not block C25)

- K209 / C24 / NEW CHAT 3 — Drive artifact lifecycle.
- Tasks C8 — blueprints vs automation rules.
- Recurring machine actor (Chat 1 debt).
- Seed fixtures still write fixed codes (not production).
- Production apply of `20260823120000_seed_sibling_entity_code_counters` — still requires the documented write pause.
- Test hygiene: `entity-code-series.int.test.ts` Lead+Support uses the live current year and leaves those counter rows. Run it only on a disposable empty database, never on shared/populated Neon.

### Findings for executor chat

None that require a product-code fix. C25 may be closed. Do not start NEW CHAT 3 until this work is committed after this PASS WITH DEBTS. Deploy still needs the write-pause sequence; do not rolling-deploy.
