# Stage Gate UX & Validation — Documentation & Rollout Plan

> Plan only (2026-05-20). Canonical spec to be written from this outline after review.

## Goal

One platform standard for **stage/status transitions with blockers**:

- Shared validation rules (`packages/shared`)
- API as final authority
- Web: instant local pre-check when data allows
- UX: open entity sheet + red field highlights + action blockers in-card — **no duplicate modal forms**

Rules differ by module, entity type, product type, and target stage. The **mechanism** is the same everywhere.

---

## Documents to create or update

### 1. New platform canon (primary)

| Action     | File                                                                         | Content                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Create** | `docs/NBOS/01-Platform-Overview/04-Stage-Gate-UX-and-Validation-Standard.md` | Full standard: principles, error contract, field vs action blockers, client/API flow, `target` navigation keys, testing |
| **Update** | `docs/NBOS/00-Technical-Decisions-By-Module.md`                              | Row per module: gate location (shared path), UX pattern, exception notes                                                |
| **Update** | `docs/NBOS/00-Implementation-Roadmap.md`                                     | Phased rollout: CRM ✓, Delivery Board (partial), Product Hub card, Finance, Support, Tasks                              |

### 2. Module canon (rules stay module-specific)

| Module              | File                                                                  | Update                                                                                                       |
| ------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| CRM Deals           | `02-Modules/01-CRM/05-Deal-Stage-Gates-and-Won-Override.md`           | Replace “fill from same flow” / modal wording with **sheet highlight UX**; reference shared package paths    |
| CRM Leads           | `02-Modules/01-CRM/03-Lead-Pipeline.md` (or lead gates doc)           | Same UX cross-link                                                                                           |
| Projects / Delivery | `02-Modules/02-Projects-Hub/07-Delivery-Board.md`                     | Stage move UX: sheet opens, highlights, Work Space tab for task blockers; no `TransitionBlockerDialog`       |
| Products            | `02-Modules/02-Projects-Hub/03-Products-and-Extensions.md`            | Product/extension gate fields by stage; align with API `product-stage-gates.ts` / `extension-stage-gates.ts` |
| Finance             | `02-Modules/04-Finance/*`                                             | Invoice/subscription/expense transitions when gates exist                                                    |
| Support             | `02-Modules/06-Support/*`                                             | Ticket status gates if canon defines them                                                                    |
| Tasks               | `02-Modules/05-Tasks/03-Recurring-Automation-and-Completion-Rules.md` | Completion gates if applicable                                                                               |

### 3. UI specifications

| File                                                        | Update                                                |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| `05-UI-Specifications/02-CRM-Pages.md`                      | Kanban drag → sheet highlight behavior                |
| `05-UI-Specifications/03-Project-Hub-Pages.md`              | Delivery Board + Product sheet                        |
| `05-UI-Specifications/07-Professional-Delivery-Card.md`     | Detail sheet `DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS` |
| `05-UI-Specifications/09-Kanban-Board-and-List-Standard.md` | Shared `Active/Closed + Board/List` visual standard   |

### 4. Business logic cross-links

| File                                                                | Update                                  |
| ------------------------------------------------------------------- | --------------------------------------- |
| `03-Business-Logic/00-Lead-Deal-Order-Project-Transition-Matrix.md` | Pointer to platform stage-gate standard |

### 5. Engineering reference (optional, after canon)

| Action | Location                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create | `docs/reference/patterns/stage-gate-implementation.md` — file map: `packages/shared`, `apps/api` wrappers, `apps/web` `handleStageGateBlocker` pattern |

---

## Technical standard (to document)

### Error contract (all modules)

```ts
{
  code: 'STAGE_GATE_VALIDATION' | 'EXTENSION_STAGE_GATE_VALIDATION' | …,
  message: string,
  errors: Array<{ field: string; message: string; target?: string }>
}
```

### Client flow

1. `getLocal*StageGateErrors(entity, targetStage)` from `@nbos/shared` when list/detail has enough fields.
2. If errors → do not move kanban column; `showStageGateRequirements(entity, errors)`.
3. Else optional optimistic column update (module decision).
4. API call → on `isStageGateApiError` → rollback if optimistic; same sheet + highlights.

### UX handler (shared web pattern)

- `stageGateHighlight: { errors }` on detail sheet
- `gateRequiredFields` → `DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS`
- Action blockers → readiness/summary list + deep link tab (`resolveBlockerDirectActions`)

### Code layout (target)

```
packages/shared/src/stage-gates/
  crm/deal-stage-gate.ts      (exists)
  projects/product-stage-gate.ts   (to extract from API)
  projects/extension-stage-gate.ts
  index.ts

apps/web/src/features/shared/stage-gate/
  stage-gate-highlight.ts     (generic fieldClass)
  use-stage-gate-transition.ts (optional hook)

apps/api — thin BadRequestException wrappers only
```

---

## Kanban / pipeline inventory (rollout after docs)

| Surface                                   | Stage gates? | Current UX                                                                    | Target                                                                                                                                                  |
| ----------------------------------------- | ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRM Deals                                 | Yes          | Sheet + local shared gate ✓                                                   | Reference implementation                                                                                                                                |
| CRM Leads                                 | Yes          | Sheet + local + API gate ✓                                                    | Maintain parity with Deals                                                                                                                              |
| Delivery Board                            | Yes          | Sheet + local gate; Active/Closed Board/List ✓                                | Maintain parity; regression tests on local gate                                                                                                         |
| Product Overview (`ProductStageGateCard`) | Yes          | Sheet field highlights + action blockers ✓                                    | Maintain parity with Delivery                                                                                                                           |
| Finance (invoices, expenses board)        | Partial      | Invoice money-status: local pre-check + sheet highlights; expenses detail TBD | Extend structured gates per [`11-Finance-Stage-Gate-and-Board-UX-Standard.md`](../02-Modules/04-Finance/11-Finance-Stage-Gate-and-Board-UX-Standard.md) |
| Support tickets                           | Lifecycle    | Active/Closed board scope; detail sheet ✓                                     | Stage-gate highlights when rules are added                                                                                                              |
| Tasks board                               | Completion   | Active/Closed scope; `TaskSheet` + completion blockers panel ✓                | Wire shared gate field highlights when API rules land                                                                                                   |

**Out of scope for first unification pass:** modules without documented stage gates in NBOS canon.

---

## Suggested implementation order

1. Approve and publish `04-Stage-Gate-UX-and-Validation-Standard.md`.
2. Extract `product-stage-gates` / `extension-stage-gates` logic to `@nbos/shared`; API re-export.
3. Delivery Board: `getLocalDeliveryStageGateErrors` + instant pre-check (parity with Deals).
4. Delivery Board: add Active List and make Active/Closed Board/List share one visual renderer family.
5. Leads: verify local gate parity.
6. Replace `ProductStageGateCard` blocker panel with sheet-first UX.
7. Finance / Support: per module canon when gates exist.

---

## Acceptance criteria (per kanban)

- [ ] No `TransitionBlockerDialog` for stage moves on that board
- [ ] Blocked drag does not leave card in wrong column (or rolls back)
- [ ] Sheet opens with red rings on required fields
- [ ] Action blockers visible without yellow banner / toast list
- [ ] API and client use same shared rule function for the same transition
- [ ] Active and Closed views use the shared board/list visual standard
