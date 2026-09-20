# 12. Decisions taken without asking, and what the Owner still has to answer

Delegation of 2026-09-20: finish the work, decide the open points from the documented base, write the
debatable ones down. Process contract in [`10-AUTONOMY-AND-REVIEW-POLICY.md`](10-AUTONOMY-AND-REVIEW-POLICY.md).

## 1. Decisions taken and already implemented

**1.1 The replacement form gets no money in its payload.** The new read endpoint
`GET /delivery-configurations/:id/replacement-plan?roleKey=…` returns components, current holders and
a "payroll already released part of this" flag, and nothing else. Reason: percents are typed by hand
and the split is computed on the server, so amounts on screen would add a leak without adding
information. Whoever runs a replacement sees who holds what, not what it pays.

**1.2 A replacement is allowed to a person who already holds a share of the same component.** The
server only refuses replacing someone with themselves. Two people sharing one component is already a
normal state after a previous replacement, so forbidding it would block a legitimate case.

**1.3 A closed delivery is read-only.** Once the product or extension is `DONE` or `LOST`, adding a
function, removing one, replacing a person, or changing extension role holders is refused with
`FINANCIAL_ALLOCATION_LOCKED`. Reason: after close, money may already be released or paid, and canon
says released money is never rewritten. Reopening a closed card is a lifecycle decision, not a
scope edit, so it stays outside this path.

The check runs inside the write transaction, after the configuration row is locked, and the Done and
Lost transitions take that same lock before writing the status. Both sides therefore queue on one
row: a scope change that started before a close either finishes first or sees the closed card. A
check before the transaction would have been advisory only.

**1.3a Done stamps the earned month in the same transaction as the status.** The payroll month of V2
delivery accruals is written next to the `DONE` status, not afterwards, so a failure cannot leave a
closed delivery whose bonus has no month and never enters payroll. This holds for every close path —
stage move, `complete` and `cancel`, for products and extensions — because each of them writes a
terminal status. The bonus-pool sync stays after commit, because it is a projection and is safe to
retry.

**1.3b A materialized plan is not re-checked against today's published norms.** Its components carry
their own unit and rate snapshots, so publishing a newer version of a profile or function must not
block closing an older card. Only a card whose plan does not exist yet is checked, and only for
functions added as paid extras; a function included in the base has no units of its own.

**1.4 Extension role assignments are editable only before the plan is materialized.** After the plan
exists, money already sits with named people, so a change is a replacement and must go through the
replacement path with its percents. Assignments also refuse two roles held by the same employee in
one request, because each role carries its own units and the same person appearing twice would be
paid twice for one request with no record of intent.

**1.5 The wallet shows the role only — no units.** An employee sees `Role: QA` next to their own
accrual. An earlier version of this decision also showed units; it was reverted, because canon
(§11 of the configurator canon) states that units and rates are not returned by the employee's API,
and amount together with units lets anyone derive the role rate. Unit detail in the wallet stays a
separate Owner decision, as canon says.

**1.6 The enrollment switch is guarded by the rules module, not by a new permission.** Reading the
switch needs `DELIVERY_COMPENSATION_RULES` VIEW, flipping it needs EDIT — the same gate as rates and
units, since the switch decides when the money model starts applying. No new permission was invented.

**1.7 The catalog seed is dry-run by default and refuses to guess an author.** `pnpm seed:delivery-catalog`
prints a plan; `--apply --author=<employeeId>` writes. Existing codes are kept untouched on a re-run,
everything created is `DRAFT` with **no units**, and the author must be a real employee id rather
than "the first Owner we find", because that id ends up on the record as who authored the content.

**1.8 QA and the technical specialist are linked into the payroll matrix like the other four roles.**
The previous code linked only PM, backend, frontend and designer, which hid QA and technical rows
from the allocation matrix even though their accruals release normally. All call sites now share one
helper and one Prisma select, so a future role change happens in a single place.

**1.9 Done is blocked, not warned, when units are missing.** A V2 card whose base profile or selected
function has no published units cannot reach `DONE`; the error names the items and no unit values. A
legacy card without a V2 configuration passes untouched. This follows the "unknown work" rule: work
proceeds, closing waits for the Owner to publish.

**1.10 There is no waiver for a card blocked on missing units — Owner decision of 2026-09-20, asked
and answered three times, do not raise it again.** A card whose base profile or extra function has no
published units simply cannot reach `DONE`. The block is the point: the case is rare, and the system
must force the norm to be filled in rather than let a closed project slip through unpriced. No button,
no endpoint, no `0 units` workaround published into the shared catalog for the sake of one card.

## 2. Open points that need the Owner

**2.2 Reopening a closed delivery.** Decision 1.3 locks scope after close. If a card is reopened
after Done — for a defect or a late change — the current rules leave the configuration locked.
Decision needed: is a reopened card allowed to change scope again, and does the new work belong to
the same accrual or to an extension.

**2.3 Sale prices are not stored yet.** The discussion settled on a per-card sale price plus a global
default, with no product-type layer. The schema and UI for that are not built; the catalog only
carries cost units. This was left out deliberately because it is a new money surface rather than a
completion of the current slices.

**2.4 The catalog content itself.** The seed ships twenty-one draft cards with scope boundaries taken
from the bootstrap document, with placeholder instructions and acceptance criteria. The cores,
modules, gradations and presets sketched in `09-CATALOG-DRAFT.md` are not seeded: they need the
Owner's numbers, and a card published with invented units would be worse than no card.

**2.5 Everything that needs a live database.** No migration, seed or HTTP call was run against any
Neon host, including the development one. The runbook lists the exact commands in order. Until they
run, every slice in the journal stays `IMPLEMENTED_NOT_VERIFIED`, and browser QA of the norms screen,
the Functions workspace and the replacement dialog has not happened.
