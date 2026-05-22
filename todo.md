# Payroll, Salary, Bonus, Wallet — remaining work

## MVP status

**Finance / Wallet compensation UX (Phases 1–7) is shipped.** Canonical flow, screens, exports, and tests are documented here:

`[docs/NBOS/02-Modules/04-Finance/12-Compensation-Roadmap-Implementation-Audit.md](docs/NBOS/02-Modules/04-Finance/12-Compensation-Roadmap-Implementation-Audit.md)`

Product canon (full target behavior): `docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md`, UI spec: `docs/NBOS/05-UI-Specifications/04-Finance-Pages.md`.

Cleanup registers (what is stale vs shipped): `docs/NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md`, `docs/NBOS/02-Modules/07-My-Company/06-My-Company-Cleanup-Register.md`, `docs/NBOS/05-UI-Specifications/06-UI-Shell-Cleanup-Register.md` § B6.

**Progress:** ☐ not started · ◐ in progress · ☑ done.

---

## 1. Bonus pool target UX and product decisions

Goal: `/finance/bonus-pools` must become the control center for product bonus money:
how much client money came in, how much bonus was planned, who should receive it,
how much was released/paid, what is still underfunded, and what KPI/cap rules changed.

- ☑ **Pool meaning:** Product / Extension = pool scope; Project = wrapper; Order = funding anchor.
- ☑ **Pool fill indicators:** Empty, Partial, Ready, Over funded, Closed (list / board / sheet).
- ☑ **Burned KPI display:** advisory when gate false; persisted `kpiBurnedAmount` on SALES payroll attach in pool lines, salary sheet, wallet.
- ☑ **Cap / carry-over:** cap (default 200% base) + carry persist/apply; `KpiPolicy.bonusCapBaseSalaryMultiplier` (1–3×) on attach + KPI policies UI.
- ☑ **Current month forecast:** wallet Bonus outlook card — incoming/predicted vs earned/payout path (snapshot).
- ☑ **Pay Now default:** `/finance/expenses` opens payroll-linked + current month; `/finance/expenses/pay` alias; clear shows all.

---

## 2. Bonus pool data and API foundation

Backend must expose pool data as product-level rollups plus employee-level breakdowns.

- ☑ **Pool rollup API:** scope, orders, project, received, planned, released, paid, remaining, available, over funding, fill %, status.
- ☑ **Multi-order pools:** aggregate all orders per Product / Extension (not one `anchorOrderId` only).
- ☑ **Employee breakdown API:** `GET /api/bonus/products/pools/lines?poolKey=` — planned, released, paid, remaining, suggested release, KPI hint.
- ☑ **Ledger traceability:** payments in + releases out timeline in pool sheet (`GET …/pools/timeline`).
- ☑ **Auto release (delivery):** sheet summary + `POST …/pools/auto-release` proportional AUTO for DONE+funded orders.
- ☑ **Auto release (sales / policy):** SALES KPI at attach; scorecard labels; payment + prior-month plan hints (KPI Plan entities backlog).
- ☑ **Manual override audit:** API requires reason (EARLY/EXTRA/OVER_FUNDING) + approver on OVER_FUNDING; release reason in pool timeline.
- ☑ **Tests:** key, kpi-held, lines batch, funding health, fold, preview label, employee CSV, auto-release trigger.

---

## 3. Finance screens and views for bonus control

UI must make the pool understandable without opening many pages.

- ☑ **Pools list view:** money cols + Fill % + Funding + employee preview line under scope.
- ☑ **Pools board view:** lanes + cards with fill bar, funding badge, team count, money summary.
- ☑ **By project view:** project summary + employee names/planned on pool cards (batch lines API).
- ☑ **Pool detail sheet:** funding hero, fill bar, money grid, orders, traceability links.
- ☑ **Suggested release panel:** totals vs funding + delivery AUTO trigger + bonus board link.
- ☑ **Employee breakdown table:** planned / released / paid / remaining / suggested + KPI gate badge.
- ☑ **Funding timeline:** payments + releases with payroll month / paid status / release reason.
- ☑ **Risk indicators:** Over funding, underfunded, KPI not passed, early/extra/over-funding release badges in sheet.
- ☑ **CSV/export:** pool roll-ups + employee breakdown export (settings → Export employees CSV, max 40 pools).

---

## 4. Policy engine (employee bonus, KPI, cap, carry-over, burned)

Backend + rules live in My Company policy templates; Finance executes. See `05-Bonus-and-Payroll.md` § Policy Engine.

- ☑ **Bonus Policy Templates:** `bonus_policies` + profile FK + picker; seeds SALES / MANUAL / DELIVERY / MARKETING / SUPPORT.
- ☑ **KPI Policy Templates:** `kpi_policies` + CRUD UI + picker; gate seeds + `scorecard_metrics` (sales plan/actual links).
- ☑ **Compensation Profile link:** create/activate profile + bonus & KPI policy dropdowns on `/my-company/compensation`.
- ☑ **Employee-level KPI:** per-employee sales plan/actual on `salary_lines` + PATCH + payroll run UI; SALES attach uses line override with run fallback.
- ☑ **Burned KPI:** `kpiBurnedAmount` + `kpiBurnedReason` on SALES attach; salary sheet, wallet, in-app notify.
- ☑ **Cap:** default 200% of base on attach; per-policy multiplier via linked `kpi_policies`; excess → `payrollCarryOverAmount`.
- ☑ **Carry-over:** FIFO auto-apply + `payrollCarryAppliedAmount` on line; detach restores release carry + reverses line carry when no releases remain.
- ☑ **Bonus breakdown statuses:** `policyBreakdownStatuses` + month summary on salary sheet / wallet pipeline.
- ☑ **Idempotency:** payroll re-attach + carry apply; SALES accrual `createMany` skipDuplicates + partial unique indexes.
- ☑ **Tests:** sales accrual + payroll attach; delivery pool sync; burned-KPI reason formatter.
- ☑ **Re-audit** API when Compensation Profile / policy schema changes (`12-Compensation-Roadmap-Implementation-Audit.md` § Policy engine).

---

## 5. Payroll and wallet integration

- ☑ **Payroll attach:** SALES KPI + cap + burned/carry persist + prior-month carry auto-apply + in-app notify.
- ☑ **Salary month sheet:** burned KPI + carry-over columns (by-source + release lines).
- ☑ **Employee wallet:** pipeline shows burned KPI and carry-over from attach.
- ☑ **Pay Now:** preset links from salary board, payroll runs, month sheet (month + employee URL filters).
- ☑ **Notifications:** KPI-reduced + carry applied/deferred in-app notify on payroll attach (no separate push channel in stack yet).

---

## 6. Other UX gaps (canon vs current MVP)

- ☑ **Salary board:** department filter (client-side on `departmentIds` from API).
- ☑ **Salary board:** calendar + list views with status colors and month dividers (shipped).
- ☑ **Payroll runs list:** table view with filters, totals, CSV export.
- ☑ **Payroll runs calendar:** year × month grid with status-colored cells.
- ☑ **Payroll runs board:** kanban lanes by run status (Draft → Closed).

---

## 7. QA and ops

- ☐ **Manual visual QA** — audit doc § Manual visual QA (salary card, bonus list, partial pay, Pay Now).
- ☐ **Push / deploy** `development` and smoke-test staging.

---

## 8. Resolved (no action)

- ☑ Bonus route: `/finance/bonuses` canonical; `/bonus` redirects with query preserved.
- ☑ Bonus pools control center: list / board / by-project + pool sheet (funding, timeline, employees, export).
- ☑ Salary route: `/finance/salary` calendar + list (grid removed).
- ☑ Payroll runs: list + board + calendar on `/finance/payroll`.
