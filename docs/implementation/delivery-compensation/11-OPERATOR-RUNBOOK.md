> Status: IMPLEMENTED_NOT_VERIFIED against a live database. Every command below is written for the
> Owner to run; nothing in this file was executed against a Neon host by the executor.

# 11. Operator runbook: going live with the unit model

Order matters. Enrollment stays closed until rates, a base profile and the functions in play carry
published units, because a delivery enrolled without units cannot be closed (Done is blocked) until
the Owner publishes them.

## 0. Preconditions

- Migrations for the delivery-compensation schema are applied to the target database.
- The Owner or CEO account has `DELIVERY_COMPENSATION_RULES` VIEW, ADD and EDIT.
- `DATABASE_URL` in the shell points at the intended environment. Check before every write.

## 1. Seed the draft catalog (optional, saves typing)

Dry run first; it prints what it would create and touches nothing:

```bash
pnpm seed:delivery-catalog
```

Apply, with the employee id that should own the drafts:

```bash
pnpm seed:delivery-catalog -- --apply --author=<employeeId>
```

The seed is idempotent: existing codes are kept as they are, so a second run creates nothing and
never overwrites content, units or status the Owner has edited.

Everything it creates is `DRAFT`: the card itself, its content with placeholder instructions and
acceptance criteria, and a **draft unit vector proposed by the executor**. Those numbers are a
starting point for review, not an agreement — a draft version pays nobody. Read them in step 4 and
publish only what you accept, after correcting what you disagree with. The scale used in the proposal
is one unit per thousand AMD of internal cost, with a tenfold default sale price.

## 2. Publish role rates

`/my-company/delivery-norms` → Role rates. Create a draft per role (the convenience action fills all
six at 1000 AMD, the agreed starting rate), then publish each one. Publishing a role rate archives
the previously published version of that role.

## 3. Publish a base profile

Same screen → Base profiles. The profile key identifies the combination the configurator will match:
entity kind, product type, product category, size, implementation base and design mode. Fill the
per-role units, mark the roles that do not take part as not required, and select the functions that
are **included in the base** (included functions are unpaid extras inside that profile).

An empty units field means not configured and blocks publishing. A typed `0` is an explicit decision
and requires an extra confirmation when publishing.

## 4. Review and publish units for the functions in play

Same screen → Function prices. Every seeded card already carries a draft proposal; publishing is how
you accept it. Only the functions actually being sold need to be published before go-live, the rest
may stay draft. A selected function without published units blocks Done on the product card and names
itself in the error.

Two cards in the catalog describe the same work at different volumes — catalogue import by size, and
multilingual support for a site versus a system. Until the tier mechanism lands, nothing stops a PM
from selecting two of those variants on one product, which would charge the same work twice. Publish
the variants you actually sell and keep the rest as drafts: a draft cannot be selected.

## 5. Open enrollment

Same screen → V2 enrollment → turn on. Only then can a new product or extension be enrolled. Existing
deliveries are untouched by this switch, and turning it back off stops new enrollments only.

## 6. First delivery end to end

1. Enrol the product (or extension) from its card.
2. Assemble the functions in the Functions workspace. For an extension, set the role holders before
   the plan is materialized.
3. Move the card to Development: this is the moment the plan and the bonus accruals are written, in
   one transaction with the stage change.
4. Change of scope afterwards: adding a function creates only the new lines; removing one archives
   its lines and keeps whatever was already accepted or released.
5. Replacing a person: the Functions workspace replacement dialog. Percents start empty on purpose —
   the money already earned stays with the outgoing person and only the remainder is split.
6. Close the card. The earned month is stamped once at the first Done and is never re-dated, so a
   repeated Done cannot move money into a different payroll month.

## 7. Rollback

- Turning the enrollment switch off stops new enrollments; it does not unenroll anything.
- An already published units version is superseded by publishing a new version, not by editing it.
  The previous version is archived and stays readable for audit.
- Accruals are never deleted to undo a decision. Scope changes archive lines and keep the ledger.

## 8. What still needs a live environment

- Real HTTP and database runs of every step above, including permission checks with a non-Owner user.
- Payroll month close with delivery accruals present for all six roles.
- Browser QA of the norms screen, the Functions workspace and the replacement dialog.
