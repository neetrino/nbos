# Entity item surface (related items in entity tabs)

> Engineering reference for `EntityItemSurface` / `EntityItemHost` (NBOS web).

## When to use

Use this pattern for **related entities shown inside a parent entity sheet tab** — tasks on a deal, invoices on a subscription, bonus entries on a product, etc.

```text
Parent entity sheet (tab) -> compact preview row/card -> click -> stacked child sheet -> close -> parent stays open
```

Rules:

- Show only what the user needs to scan the list (title, status, amount, date).
- Click opens the **full detail sheet** for that item — not navigation away from the parent.
- Child sheet stacks above the parent (`forceNestedBackdrop` / variant A).
- Parent sheet remains open when the child closes.

## When not to use

| Surface                                      | Use instead                                                       |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Module page board / kanban                   | `KanbanBoard` + module board card (`TaskMiniCard`, `DealCard`, …) |
| Module page list / table                     | Module table or list renderer                                     |
| Single link to filtered page                 | `Link` drill-down when preview adds no value                      |
| Full workspace tab (e.g. Product Work Space) | Dedicated workspace runtime, not `EntityItemList`                 |

Board cards and tab preview items may share visual tokens but are **different components** — board cards support drag, column actions, and dense board context.

## Components

| Piece                 | Location                                   | Role                                                    |
| --------------------- | ------------------------------------------ | ------------------------------------------------------- |
| `EntityItemSummary`   | `entity-item.types.ts`                     | Normalized preview model (`kind`, `title`, `status`, …) |
| `EntityItemSurface`   | `EntityItemSurface.tsx`                    | One preview item (`list-row` \| `compact-card`)         |
| `EntityItemList`      | `EntityItemList.tsx`                       | Collection + empty state                                |
| `EntityItemHost`      | `EntityItemHost.tsx`                       | Opens stacked child sheets                              |
| `useEntityItemHost()` | `entity-item-context.tsx`                  | `openEntityItem({ kind, id })`                          |
| Feature adapters      | `features/*/entity-item/*-item-summary.ts` | API DTO → `EntityItemSummary`                           |

Public exports: `apps/web/src/components/shared/entity-item/` (re-exported from `@/components/shared`).

## View modes (tabs only)

Inside entity tabs, use **two** preview modes via `ViewModeSwitch` + `ENTITY_ITEM_VIEW_OPTIONS`:

| Variant        | Default for                    |
| -------------- | ------------------------------ |
| `list-row`     | Long lists, dense scan         |
| `compact-card` | Shorter lists, visual grouping |

Do not add kanban inside entity tabs unless the tab is a full workspace (see Product Tasks / Work Space).

## Wiring

Wrap the **parent entity sheet** in `EntityItemHost`. Tab content calls `openEntityItem`.

```tsx
<EntityItemHost nested onEntityChanged={refreshParent}>
  <Sheet open={open} onOpenChange={onOpenChange}>
  <EntityDetailSheetContent …>
    {/* tabs */}
    <EntityItemList
      items={summaries}
      variant={viewVariant}
      onOpen={(item) => openEntityItem({ id: item.id, kind: item.kind })}
      emptyIcon={CheckSquare}
      emptyTitle="Tasks"
    />
  </EntityDetailSheetContent>
  </Sheet>
</EntityItemHost>
```

Child sheets opened by the host pass `forceNestedBackdrop` so overlay and rail sit above the parent panel. See [`entity-detail-sheet-shell.md`](./entity-detail-sheet-shell.md).

## Adding a new entity kind

1. Extend `EntityItemKind` in `entity-item.types.ts`.
2. Add adapter: `features/<module>/entity-item/<kind>-item-summary.ts`.
3. Register open handler in `EntityItemHost` (fetch + correct `*Sheet`).
4. Wrap parent sheet with `EntityItemHost` if not already wrapped.
5. Replace inline `<ul>` / custom rows in the tab with `EntityItemList`.

## Pilot implementations

| Tab                     | Parent sheet              | Adapter                   | Child sheet    |
| ----------------------- | ------------------------- | ------------------------- | -------------- |
| Deal → Tasks            | `DealSheet`               | `task-item-summary.ts`    | `TaskSheet`    |
| Subscription → Invoices | `SubscriptionDetailSheet` | `invoice-item-summary.ts` | `InvoiceSheet` |

## Canon

Product context (sheet-first, tabs, linked entities): [`docs/NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md`](../../NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md)
