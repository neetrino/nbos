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
- ◐ **Cap / carry-over:** monthly cap (200% base) + persisted carry-over on attach; pool/wallet/salary display; policy templates for custom cap still pending.
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
- ◐ **Auto release (sales / policy):** SALES KPI scale at payroll attach; full policy engine still pending.
- ◐ **Manual override audit:** API requires reason (EARLY/EXTRA/OVER_FUNDING) + approver on OVER_FUNDING; release reason in pool timeline.
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

- ☐ **Bonus Policy Templates:** sales, delivery, marketing, support, manual.
- ◐ **KPI Policy Templates:** `kpi_policies` + default seed bands; attach resolves via Compensation Profile; My Company CRUD UI pending.
- ☐ **Compensation Profile link:** active bonus + KPI policies, currency, effective dates.
- ☐ **Employee-level KPI:** per employee/role, not only payroll-run sales KPI scale.
- ◐ **Burned KPI:** persist `kpiBurnedAmount` on SALES attach + Finance/Wallet display; reason field / full policy templates still pending.
- ◐ **Cap:** default 200% of base salary on attach; excess → `payrollCarryOverAmount`; Compensation Profile cap policy pending.
- ◐ **Carry-over:** persist deferred amount on attach; show in Finance/Wallet; auto-apply to next month run still pending.
- ☐ **Bonus breakdown statuses:** Incoming, Burned, Carry-over, Clawback in API + UI.
- ☐ **Idempotency:** no duplicate entries/releases/burned/carry-over on recalc.
- ◐ **Tests:** burned/cap attach + KPI gate parse/resolve unit tests; next-month carry apply + re-attach idempotency pending.
- ☐ **Re-audit** API when Compensation Profile / policy schema changes.

---

## 5. Payroll and wallet integration

- ◐ **Payroll attach:** SALES KPI + cap + burned/carry-over persist + notify; next-month auto-apply pending.
- ◐ **Salary month sheet:** burned KPI + carry-over columns (by-source + release lines).
- ◐ **Employee wallet:** pipeline shows burned KPI and carry-over from attach.
- ☑ **Pay Now:** preset links from salary board, payroll runs, month sheet (month + employee URL filters).
- ◐ **Notifications:** KPI-reduced in-app notify on payroll attach + activity detail; carried push still pending.

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
