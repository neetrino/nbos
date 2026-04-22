# NBOS Platform - Unified Development Plan

**Project:** NBOS Platform  
**Project size:** C (monorepo: `apps/*`, `packages/*`)  
**Document role:** single source of truth for roadmap + progress + next actions  
**Updated:** 2026-04-22  
**Status:** active

---

## 1) Why this document exists

This file replaces fragmented planning status across multiple files.  
From now on, planning, progress, and execution sequence live here only.

Linked context:

- Product and module canon: `docs/NBOS/00-Documentation-Hub.md`
- Architecture baseline: `docs/01-ARCHITECTURE.md`
- Stack and operational constraints: `docs/TECH_CARD.md`
- Delivery matrix: `docs/execution/01-module-delivery-matrix.md`
- Performance governance: `docs/execution/02-performance-governance.md`
- Two-week kickoff tracker: `docs/execution/03-two-week-kickoff.md`

---

## 2) Current factual project state (codebase check)

### 2.1 Monorepo and platform foundation

- `pnpm` workspace and `turbo` scripts are configured at root.
- `apps/api` (NestJS) and `apps/web` (Next.js App Router) are present and wired.
- Shared packages exist and are used (`packages/database`, `packages/shared`, config packages).
- Core dev scripts are available (`dev`, `build`, `lint`, `typecheck`, `test`, `db:*`).

### 2.2 Backend module coverage (`apps/api`)

Implemented modules are present for:

- Auth, Employees, Roles, Departments, Invitations
- CRM (Leads, Deals)
- Projects (Projects, Products, Extensions)
- Clients (Contacts, Companies)
- Finance (Orders, Invoices, Payments, Subscriptions, Billing)
- Tasks, Support, Expenses, Bonus
- Credentials, Drive, Notifications, Audit
- Automation, Scheduler, Messenger, Partners, System Lists

### 2.3 Frontend route coverage (`apps/web`)

UI routes are present for:

- Dashboard, CRM (leads/deals/dashboard), Projects
- Clients, Finance (orders/invoices/payments/subscriptions/dashboard/expenses)
- Tasks, Support, Bonus, Expenses
- Credentials, Drive, Messenger, Calendar
- Partners, Settings (lists/roles/departments), auth pages

### 2.4 Conclusion

Project is no longer at initialization stage.  
The real state is **post-MVP with broad module coverage**, and work should move to behavioral hardening, consistency, integrations, and migration readiness.

---

## 3) Documentation consolidation decision

### 3.1 Canonical planning policy

- This file is the only active planning/progress file.
- Older planning/progress artifacts are archived.
- If a phase is completed, update this file immediately.

### 3.2 Archived files

- `docs/PLAN_NEW_DESCRIPTION_SYNC.md` -> `docs/archive/plans/PLAN_NEW_DESCRIPTION_SYNC.archived.md`
- `docs/PROGRESS.md` -> `docs/archive/plans/PROGRESS.archived.md`

---

## 4) Delivery phases (re-baselined)

## Phase P0 - Platform baseline (done)

- Monorepo scaffold, root quality scripts, docs baseline.
- API and web apps are operational.

## Phase P1 - Functional breadth (mostly done)

- Core modules exist in API and web.
- Primary CRUD and boards are implemented for major domains.

## Phase P2 - Behavior correctness (current priority)

Focus: stage gates, required fields by deal/product flow, cross-module invariants, list-driven behavior.

## Phase P3 - Operational hardening (next)

Focus: observability depth, error semantics consistency, idempotent automation behavior, audit completeness.

## Phase P4 - Integrations and data migration readiness

Focus: external integrations maturity and Bitrix migration toolchain/runbook.

---

## 5) Module-by-module execution plan (what to do next)

Rules:

- Move module by module, do not spread changes across many domains in one cycle.
- Each module closes with explicit exit criteria and docs update in this file.
- Sequence respects business criticality and dependency chain.

### M1 - CRM -> Product/Order transition integrity (done)

Scope:

- Finalize `Deal Won` automation invariants.
- Ensure `EXTENSION` deals correctly bind to existing product/project context.
- Enforce stage required fields by deal type and stage transitions.

Exit criteria:

- No invalid state transition in deals pipeline.
- Auto-created or linked entities are deterministic and auditable.
- Negative-path tests for stage gate failures are present.

Current status:

- `updateStatus` idempotency added for repeated status updates.
- `DealWonHandler` paths are covered by focused tests (PRODUCT and EXTENSION).
- Stage gate validation tests pass for cumulative and type-specific requirements.
- Cross-module `Deal -> Order -> Invoice` regression checks are now covered and green.

### M2 - Projects Hub domain consistency (done)

Scope:

- Align project/product/extension lifecycle semantics with current CRM outputs.
- Validate Product/Extension status transitions against required linked entities.
- Confirm task linkage behavior (`productId`, `extensionId`) in API + UI.

Exit criteria:

- Product-centric workflow has no ambiguous ownership or status contradictions.
- Project overview metrics are derivable from real source entities only.

Current status:

- `ProjectsService.findById` returns product-centric project snapshot with `products` and `extensions`.
- Product stage gates now enforce required linked entities for `NEW -> CREATING`.
- Extension stage gates now enforce required linked entities for `NEW -> DEVELOPMENT`.
- Task linkage by `PRODUCT` and `EXTENSION` is regression-covered in API tests.
- Project detail UI consumes the unified project snapshot for products/extensions instead of split sources.

### M3 - Finance core correctness

Scope:

- Verify end-to-end: `Order -> Invoice -> Payment -> status sync`.
- Tighten rules for partial/full payment, overdue transitions, and billing cycle behavior.
- Confirm tax status inheritance and reconciliation behaviors.

Exit criteria:

- Financial status machine is deterministic.
- Scheduled billing and payment side effects are idempotent.
- Key finance dashboards show consistent aggregates vs API data.

### M4 - Tasks and Support operational flow

Scope:

- Validate auto-task creation triggers and deduplication.
- Validate support SLA timers and escalation behavior.
- Ensure board/list counters and API stats are aligned.

Exit criteria:

- SLA and task automation are reproducible in repeated runs.
- No drift between board state and backend source of truth.

### M5 - Security-sensitive modules (Credentials, Drive, Audit)

Scope:

- Credentials access path and audit completeness verification.
- Drive file lifecycle checks (upload, retrieval, metadata consistency).
- Audit query usability for incident review.

Exit criteria:

- Every sensitive action is auditable with actor + target + timestamp.
- Access boundaries are enforced and test-covered.

### M6 - Communication and productivity modules

Scope:

- Messenger, Notifications, Calendar, Partners, Dashboards.
- Cross-module links quality and UI flow coherence.
- Performance sanity for heavy list/dashboard pages.

Exit criteria:

- UX flows are coherent with business process.
- No critical dead ends or contradictory links in navigation.

### M7 - Integration and migration preparation

Scope:

- Stabilize integration contracts (bank/telegram/whatsapp/gov invoicing where applicable).
- Build migration mapping checklist (Bitrix -> NBOS entities).
- Define dry-run migration sequence and rollback strategy.

Exit criteria:

- Migration playbook can run in staged environment.
- Data mapping risks are explicitly documented and owned.

---

## 6) Priority backlog (next 2-4 weeks)

1. Execute M3 (Finance correctness).
2. Continue focused regression tests for cross-module trigger chains:
   - Deal -> Order/Project/Product
   - Invoice/Payment -> Order and downstream effects
   - Product -> task automation
3. Normalize docs where they still reflect old phase assumptions.

---

## 7) Progress log (new format)

### 2026-04-22

- Re-baselined roadmap from "init/MVP pending" to actual "broad modules implemented".
- Consolidated plan/progress into one canonical file.
- Set module-by-module execution order with clear exit criteria.
- Added delivery execution artifacts under `docs/execution/`:
  - module delivery matrix
  - performance-first governance policy
  - two-week kickoff tracker
- Stabilized CRM transition behavior:
  - prevented duplicate side effects on repeated `WON` status updates
  - added `DealWonHandler` unit tests for PRODUCT and EXTENSION flows
- Closed M1 CRM -> Product/Order integrity:
  - added regression tests for `Deal -> Order -> Invoice` chain visibility in CRM reads
  - verified invoice-driven deal promotion only happens when all linked invoices are paid and covered
  - verified incomplete invoice chains do not falsely promote deals
- Closed M2 Projects Hub domain consistency:
  - unified project detail snapshot around `products` and `extensions`
  - validated required linked-entity stage gates for product/extension transitions
  - verified task linkage behavior for product/extension entity views
  - aligned project detail UI to derive product/extension metrics from project source data
- Strengthened finance transition coverage:
  - added tests for partial/full payment synchronization outcomes

---

## 8) Working protocol for every next module

For each module cycle:

1. Confirm target scope and invariants.
2. Implement/fix behavior in API + web where needed.
3. Add or update tests.
4. Run lint/typecheck/tests for touched modules.
5. Update this file:
   - mark module status
   - append change log entry
   - state next module

---

## 9) Current next action

**Start M3:** verify Finance core correctness for `Order -> Invoice -> Payment -> status sync`.
