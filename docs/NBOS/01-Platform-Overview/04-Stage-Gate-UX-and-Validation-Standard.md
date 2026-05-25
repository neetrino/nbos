# Stage Gate UX and Validation Standard

> Canon for how NBOS validates workflow transitions and surfaces blockers in the UI.

## Rules

1. **Shared validation** — Product and extension stage gates live in `@nbos/shared`; API is final authority.
2. **Local pre-check** — Boards run shared rules on list/sheet data before calling the API when enough fields are present.
3. **No duplicate forms** — Blockers open the entity sheet with field highlights; no second modal form for the same fields.
4. **Action blockers** — Open tasks, finance, and client acceptance surface as action blockers with links to Work Space / Finance where applicable.

## Response contract

```json
{
  "statusCode": 400,
  "code": "STAGE_GATE_VALIDATION",
  "message": "...",
  "errors": [{ "field": "deadline", "message": "..." }]
}
```

Extension gates use `EXTENSION_STAGE_GATE_VALIDATION`.

## UI pattern

- Highlight invalid fields on the General (or relevant) tab.
- Prefer Work Space tab when `tasks`, `extensions`, or `tickets` block.
- Kanban drag / Move next / Complete use the same flow.

## References

- Rollout plan: [`04-Stage-Gate-UX-Standard-Plan.md`](04-Stage-Gate-UX-Standard-Plan.md)
- Kanban visual: [`../05-UI-Specifications/09-Kanban-Board-and-List-Standard.md`](../05-UI-Specifications/09-Kanban-Board-and-List-Standard.md)
- CRM reference: `packages/shared/src/crm/deal-stage-gate.ts`
