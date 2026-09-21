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

**1.11 A closed card may be reopened for work, but never for money — Owner decision of 2026-09-20.**
Taking `DONE` off a card so a defect can be fixed is allowed; the configurator stays read-only from
the first close onwards. Scope, role holders and amounts are frozen: the fix is either unpaid warranty
work in ordinary tasks, or, when it is large enough to be paid, a new Extension with its own plan.
Nothing is recalculated on the closed plan, which is what canon means by "a finished product does not
reopen the configurator".

Implementation consequence: the read-only guard must key off "this delivery was closed at least once",
not off the current status, because a reopened card is `DEVELOPMENT` again. A `scopeLockedAt` stamp on
the configuration, written at the first close, is the intended carrier. Today no reopen path exists at
all (`ensureNotTerminal` refuses any move once a resolution is set), so the guard is still correct;
the stamp has to land together with the reopen action, not after it.

**1.12 Sale price: AMD per unit always stored on the card version — Owner decision of 2026-09-20;
multiplier withdrawn 2026-09-21; implicit default withdrawn 2026-09-21.** Each function, gradation
and core carries its own client rate in AMD per unit. There is no fallback: no stored rate means no
client amount. The line is `units × that rate`. Cost (`units × developer rate`) is not part of what
the client pays and is not an input to this field.

The 2026-09-20 implementation — a multiplier (default 10) plus an optional fixed amount that won —
is withdrawn. The 2026-09-21 implicit “empty = 10 000” fallback is also withdrawn: a new draft cannot
be saved without a number, and the seed publishes 10 000 (AI 20 000). The Owner's examples in
[`08`](./08-CONSTRUCTOR-AND-SIZING.md) are different _rates_ (blog ~5 000, AI ~20 000, ordinary work
10 000, services lower), not a factor on cost. One field covers them. The client amount is not a
secret: the catalog card shows the resolved AMD; units stay behind RULES VIEW.

Sale prices are versioned like units, so a price change never re-prices deals that were already
assembled. This was not asked separately: unversioned prices would silently rewrite history, which
canon already forbids for units and rates.

**1.13 The executor fills the catalog, the Owner reviews the numbers — Owner decision of
2026-09-20.** Product types and the whole function catalog, including proposed units, are written by
the executor from what the business already does; there are no secrets here that would require asking
per card. The Owner reads the finished list once it exists, because comparing ready numbers is faster
than dictating them from nothing. Everything is written as DRAFT, so a proposal cannot pay anyone
until he publishes it.

Delivered on the same day: 202 cards in 18 categories with per-role unit proposals, on the scale of
one unit for one thousand AMD of internal cost. Sale rates are stored on each card (seed: 10 000,
AI 20 000). The catalog is meant to hold one to two hundred cards, so categories are browsing aids,
not restrictions: a `commerce` function may be selected for a CRM.

**1.14 Catalog review of 2026-09-20: what was accepted and what was not.** A cross-family review of the
202 cards raised fifteen findings. Accepted and fixed: the paid translation service was removed, since
the Owner had already decided there is no such service and the AI does the translating; site
multilingual support dropped from 21 to 10 units to match his own estimate; the unnamed ARCA bank was
raised to the same 25 units as the named banks, because the work is identical; catalogue import lost its
backend share to the technical specialist and gained bounded ranges instead of an open "above 10 000";
security hardening was capped to high and critical findings on a named list of surfaces; channel
integrations for SMS, WhatsApp and Viber moved their frontend units to backend, as their scope contains
no interface; label printing raised its technical specialist share to match comparable device work; cash
on delivery, the forced-update screen and demo data were folded into the core, the store publishing card
and launch support, being too small to be catalog functions on their own; accessibility moved from
content to platform; three genuinely sold functions were missing and were added — catalogue import and
export inside the product, crash and product analytics for mobile, and electronic invoicing with the
state system; the AI chatbot and the generic ERP integration got measurable caps on sources, entities
and languages.

Rejected, with reasons. The one-click quick order stays a separate card: it is sold on its own in this
market, and canon forbids splitting the catalog down to buttons, not keeping a small but real feature.
Data migration stays a service rather than an integration: the Owner treats a migration as one-off work
done by people, and its units sit with PM and the technical specialist accordingly.

Not a defect but real: the review is right that mutually exclusive variants — import by volume,
multilingual site versus system — are currently separate selectable cards, so both could be added to one
product and charge the same work twice. The agreed model puts gradations inside one card, which needs
tier-scoped price versions and a feature-to-tier link. That is the next slice; until it lands, the
runbook tells the Owner to publish only the variants he sells, because a draft cannot be selected.

**1.15 How a function that costs differently in different products is priced — recommended and adopted
2026-09-20.** Multilingual support is the sharpest case, but the same shape applies to search, roles and
a few others: one and the same function is small in a landing page and large in an ERP. Three ways were
possible.

Separate cards per product group is what the catalog has today and it is the worst of the three: the
product group is already known from the base profile, so asking a human to pick the matching card adds
nothing but the chance of picking two at once and charging the same work twice. Per-profile unit
overrides on every function are the most precise, but they multiply data entry across two hundred cards
and many profiles, and the Owner would be filling numbers he does not care about.

Adopted: **one card, gradations inside it, and the gradation chosen automatically from the product**.
The card stays single, so it cannot be double-selected; units live on the gradation and are published
per gradation, so history and audit stay honest; the configurator picks the gradation from the base
profile, so nobody chooses by hand in the normal case, with a manual override plus reason for the rare
one. For the smallest gradation the card can simply be marked included in the base of those profiles,
which is exactly the Owner's "on a landing page it is nearly free".

Second half of the same decision: **we charge for the fact of multilingual support, not per language.**
The second language is the architecture — keys, switching, system texts, emails; the third and fourth
are almost free because the AI translates. A language that changes the writing direction or the alphabet
is not covered and is registered as unknown work.

Gradations of multilingual support therefore are: landing, visit card and company site (normally
included in the base of those profiles); shop, blog and content site, where content lives in the
database; CRM, ERP and platform, where every screen, dictionary and document is affected. A mobile app
follows its own kind rather than the fact of being an app, because identical functionality costs the
same on web and on mobile.

**1.16 In-app crash reporting is kept as a draft the company does not sell.** The Owner does not
recognise it as something they do. The card stays in the catalog as a draft, which means it cannot be
selected by anyone, and it must not be published unless such work is actually sold. Kept rather than
deleted so the norm is ready if a client asks; it costs nothing while it stays draft.

**1.17 Platform is WEB / APP / DESKTOP, never MOBILE_APP — Owner confirmation of 2026-09-21.** Kind
and platform are separate fields. `ProductTypeEnum.MOBILE_APP` stays as a legacy kind until the type
list is revised; the new axis is `productPlatform` with values WEB, APP and DESKTOP. Same function,
same units on every platform, so platform is not part of the base-profile key. WordPress and Shopify
stay WEB-only. **Marketing has no platform** (decision 1.20). Legacy `MOBILE_APP` kinds backfill to
APP; the Owner still assigns a real kind by hand.

**1.18 Size is gone; named collections are a replace-helper — Owner decision of 2026-09-21.**
`configSize` is not a product, not a core price and not a calculation axis. One kind has one core
and one core price (today's CLASSIC numbers). The 0.8…2 core multipliers and the five shop cards
were a lie: composition did not change, money did. Catalog volume (500 vs 500 000 SKU) is not a
global multiplier; it lives on import, search and load cards.

A collection is a named list of extra function ids for a product type. The Owner authors it. A click
in the deal constructor _replaces_ the extra selection; the seller then removes and adds by hand.
The collection is not included-in-base and is not stored on the deal as a norm (last-applied id is
UI only). The quote does not overwrite the deal amount.

The constructor lives on the deal until Won, then extras copy onto the product configuration.
The public vitrine is stage 3: same catalog, sale price only, not in this wave. `Extension.size`
is a different enum and stays.

**1.19 Extension.size has three values — Owner decision of 2026-09-21.** The change-order enum
is `SMALL` / `STANDARD` / `LARGE`. Existing `MICRO` rows map to `SMALL`; `MEDIUM` maps to
`STANDARD`. Auto-created extensions from a Won deal default to `STANDARD`. The Change Control
"Micro Extension" path (paid work under one hour) is a process, not a fourth size.

**1.20 Marketing has no platform; Mobile App is not a new type — Owner confirmation of 2026-09-21.**
The earlier WEB-only shortcut for Marketing was a form gate, not a business meaning. Marketing
stores `productPlatform = NULL` and the field is hidden. Code keeps WEB / APP / DESKTOP;
WordPress and Shopify stay WEB. `MOBILE_APP` stays in the enum for legacy cards and is hidden from
new type pickers (current value still shows). App Store access slots follow platform APP (legacy
`MOBILE_APP` type still qualifies). `WEB_APP` remains a real kind (web application), not a platform.

**1.21 Implementation base, design modes and AI-reviewer are not axes — Owner decision of 2026-09-21.**
They will not be chosen in Deal, Product, Delivery or norms. Matching a published core uses
`entityKind` + `productType` (category wildcard as before). Standard design lives in the core.
Columns stay in the database and every new write freezes `FROM_SCRATCH` / `AI_DESIGN` / `false`.
`AI_DESIGNER_REVIEW_REQUIRED` no longer blocks a plan. Enrollment binds the published core when
one exists so Starting is not stuck on `CONFIGURATION_INCOMPLETE`.

## 2. Open points that need the Owner

**2.1 Everything that needs a live database.** No migration, seed or HTTP call was run against any
Neon host, including the development one. The runbook lists the exact commands in order. Until they
run, every slice in the journal stays `IMPLEMENTED_NOT_VERIFIED`, and browser QA of the norms screen,
the Functions workspace, the catalog browser and the replacement dialog has not happened. This is not
a question to answer: it is work only the Owner can start.
