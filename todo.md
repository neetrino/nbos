# Entity Item Surface — план реализации

Паттерн: **компактный preview в табе → клик → stacked child sheet (вариант A) → закрыть → родительский sheet остаётся**.

## Phase 0 — Design tokens & types

- [x] `entity-item.types.ts` — `EntityItemSummary`, `EntityItemKind`, `EntityItemVariant`
- [x] `entity-item-classes.ts` — общие Tailwind-классы для list-row / compact-card

## Phase 1 — Presentation layer

- [x] `EntityItemSurface` — единый UI preview (title, status, metric, meta)
- [x] `EntityItemList` — коллекция + empty state
- [x] `entity-item-view-options` — list / compact-card для `ViewModeSwitch`
- [x] Экспорт из `components/shared/index.ts`

## Phase 2 — Adapters (feature → summary)

- [x] `task-item-summary.ts` — Task → EntityItemSummary
- [x] `invoice-item-summary.ts` — subscription invoice row → EntityItemSummary

## Phase 3 — EntityItemHost (stacked sheets)

- [x] `entity-item-context.tsx` — `useEntityItemHost`, `openEntityItem`
- [x] `EntityItemHost` — TaskSheet + InvoiceSheet с `forceNestedBackdrop`
- [x] Проброс `forceNestedBackdrop` в TaskSheet / InvoiceSheet

## Phase 4 — Pilot tabs

- [x] `DealTasksTab` — EntityItemList + open TaskSheet
- [x] `DealSheet` — обёртка `EntityItemHost`
- [x] `SubscriptionInvoicesTab` — EntityItemList + open InvoiceSheet
- [x] `SubscriptionDetailSheet` — обёртка `EntityItemHost`

## Phase 5 — Verify & commit

- [x] Typecheck / lint затронутых файлов
- [x] Git commit
