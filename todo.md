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
- ◐ **Burned KPI display:** advisory KPI held in employee API/sheet/CSV when gate false; ledger burned pending policy engine.
- ☐ **Cap / carry-over:** auto-apply in payroll vs advisory until policy engine ships.
- ☐ **Current month forecast:** wallet card — earned-only vs incoming/predicted bonus.
- ☐ **Pay Now default:** all expenses vs dedicated payroll preset/filter as default landing.

---

## 2. Bonus pool data and API foundation

Backend must expose pool data as product-level rollups plus employee-level breakdowns.

- ☑ **Pool rollup API:** scope, orders, project, received, planned, released, paid, remaining, available, over funding, fill %, status.
- ☑ **Multi-order pools:** aggregate all orders per Product / Extension (not one `anchorOrderId` only).
- ☑ **Employee breakdown API:** `GET /api/bonus/products/pools/lines?poolKey=` — planned, released, paid, remaining, suggested release, KPI hint.
- ☑ **Ledger traceability:** payments in + releases out timeline in pool sheet (`GET …/pools/timeline`).
- ◐ **Auto release suggestions:** proportional `suggestedReleaseAmount` per employee in API; full auto-release flow still pending.
- ☐ **Manual override audit:** reason/approval for early / extra / over funding / cap override.
- ☑ **Tests:** key, kpi-held, lines batch, funding health, fold, preview label, employee CSV.

---

## 3. Finance screens and views for bonus control

UI must make the pool understandable without opening many pages.

- ☑ **Pools list view:** Product / Extension, Order(s), Project, money cols, Fill %, Funding badge, team count.
- ☑ **Pools board view:** lanes + cards with fill bar, funding badge, team count, money summary.
- ☑ **By project view:** project summary + employee names/planned on pool cards (batch lines API).
- ☑ **Pool detail sheet:** funding hero, fill bar, money grid, orders, traceability links.
- ☑ **Employee breakdown table:** planned / released / paid / remaining / suggested + KPI gate badge.
- ☑ **Funding timeline:** payments + releases with payroll month / paid status on release rows.
- ☑ **Risk indicators:** Over funding, underfunded, KPI not passed, early/extra/over-funding release badges in sheet.
- ☑ **CSV/export:** pool roll-ups + employee breakdown export (settings → Export employees CSV, max 40 pools).

---

## 4. Policy engine (employee bonus, KPI, cap, carry-over, burned)

Backend + rules live in My Company policy templates; Finance executes. See `05-Bonus-and-Payroll.md` § Policy Engine.

- ☐ **Bonus Policy Templates:** sales, delivery, marketing, support, manual.
- ☐ **KPI Policy Templates:** `<50% = 0%`, `50–69% = 50%`, `≥70% = 100%`, role variants.
- ☐ **Compensation Profile link:** active bonus + KPI policies, currency, effective dates.
- ☐ **Employee-level KPI:** per employee/role, not only payroll-run sales KPI scale.
- ☐ **Burned KPI:** persist reduced amount + reason; show in Finance and Wallet.
- ☐ **Cap:** enforce on release attach; persist capped amount + reason.
- ☐ **Carry-over:** advance unpaid release balance to next payroll month (no double pay).
- ☐ **Bonus breakdown statuses:** Incoming, Burned, Carry-over, Clawback in API + UI.
- ☐ **Idempotency:** no duplicate entries/releases/burned/carry-over on recalc.
- ☐ **Tests:** cap, carry-over across months, burned KPI, re-attach idempotency.
- ☐ **Re-audit** API when Compensation Profile / policy schema changes.

---

## 5. Payroll and wallet integration

- ◐ **Payroll attach:** SALES KPI scale at attach exists; full KPI/cap/carry-over amounts pending.
- ☐ **Salary month sheet:** planned, released, burned, carry-over, paid, remaining by bonus source.
- ☐ **Employee wallet:** explanations for partial / delayed / carried / burned / paid / clawback.
- ☐ **Pay Now:** payroll expenses easy to filter from salary/bonus context.
- ◐ **Notifications:** wallet hints on release/paid exist; KPI reduced / carried copy pending.

---

## 6. Other UX gaps (canon vs current MVP)

- ☐ **Salary board:** department filter (CEO/Finance parity).
- ☑ **Salary board:** calendar + list views with status colors and month dividers (shipped).
- ☐ **Payroll run:** Board / Calendar for runs list (list + detail exist).

---

## 7. QA and ops

- ☐ **Manual visual QA** — audit doc § Manual visual QA (salary card, bonus list, partial pay, Pay Now).
- ☐ **Push / deploy** `development` and smoke-test staging.

---

## 8. Resolved (no action)

- ☑ Bonus route: `/finance/bonuses` canonical; `/bonus` redirects with query preserved.
- ☑ Bonus pools: list / board / project views + scope columns (Product / Extension · Order · Project).
- ☑ Salary route: `/finance/salary` calendar + list (grid removed).
