# Entity Detail Sheet Shell — Floating Rail Standard

`[ ]` open · `[x]` done · `[review]` waiting for visual approval

**Цель:** один NBOS-слой для entity detail sheets — панель + blur + floating rail без ручной сборки в каждом модуле.

**Решение (согласовано):** не зашивать rail в низкоуровневый `SheetContent`, а ввести `EntityDetailSheetContent` (shell) поверх него.

**Canon (обновить после Step 1):**

- [`docs/NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md`](docs/NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md)

**Связь:** визуальный rollout — [`desigen.todo.md`](desigen.todo.md); этот файл — только инфраструктура sheet + rail.

---

## Стандарт поведения

| Кнопка / зона             | Правило                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Close**                 | Всегда автоматически у entity detail sheet (через shell).                                                             |
| **Copy link**             | По умолчанию да, если передан `sourcePageHref` или sheet открыт с deep-link URL (clipboard = `window.location.href`). |
| **Open**                  | Если есть `sourcePageHref` (страница/запись в новой вкладке).                                                         |
| **Dashboard / Workspace** | Только если передан `workspaceHref`.                                                                                  |
| **Доп. кнопки**           | `trailingRail` — модуль решает сам (files, portfolio, checklist и т.д.).                                              |

**Ширина (prop `width`):**

- `wide` — 75vw + anchor `DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS` (Lead, Deal, Delivery, Subscription, Support, Company, Contact…)
- `medium` — medium token + anchor (Client Service)
- `compact` — 42rem + anchor (Invoice)

**Не entity sheet** (оставить прямой `SheetContent`): короткие dialogs, nested child sheets без rail, спец. layout (Drive panel — отдельное решение в Step 4).

---

## Step 0 — Подготовка

- [ ] Прочитать `apps/web/src/components/ui/sheet.tsx` (`floatingClose`, `floatingRail`, `floatingRailVisible`, anchor).
- [ ] Прочитать `entity-sheet-floating-rail.tsx` и `detail-sheet-classes.ts`.
- [ ] Зафиксировать reference: `DealSheet` + `InvoiceSheet` (уже с rail) vs `ClientServiceDetailSheet` (без rail — регрессия для исправления).

---

## Step 1 — Shell-компонент + экспорт

**Файл:** `apps/web/src/components/shared/EntityDetailSheetContent.tsx`

- [ ] Создать `EntityDetailSheetContent` с props:
  - `width: 'wide' | 'medium' | 'compact'`
  - `open` (для `floatingRailVisible`, синхрон с анимацией)
  - `sourcePageHref?: string` — для Open; Copy link всегда при entity sheet
  - `workspaceHref?: string | null`
  - `trailingRail?: ReactNode`
  - `forceNestedBackdrop?` — проброс в `SheetContent` для nested sheets
  - остальное — `SheetContent` props без дублирования rail-флагов
- [ ] Внутри: `showCloseButton={false}`, `floatingClose`, `floatingRail={<EntitySheetFloatingRail … />}`, className + anchor из width map (одна map-константа, без magic strings в фичах).
- [ ] Экспорт из `components/shared/index.ts`.
- [ ] JSDoc: когда использовать shell vs голый `SheetContent`.

**Acceptance Step 1:**

- [ ] Один модуль (например `InvoiceSheet`) переведён на shell — визуально без изменений, rail появляется синхронно с blur.
- [ ] Commit: `feat(web): add EntityDetailSheetContent shell for entity sheets`

---

## Step 2 — Документация canon

- [ ] В `10-Entity-Detail-Sheet-Standard.md` добавить секцию **Floating rail**:
  - Close обязателен для entity detail sheet;
  - Copy / Open / Workspace — по данным;
  - `trailingRail` для модульных действий;
  - ссылка на `EntityDetailSheetContent` + `EntitySheetFloatingRail`.
- [ ] В `desigen.todo.md` → Working Rule: заменить ручную сборку rail на `EntityDetailSheetContent` где применимо.
- [ ] Commit: `docs: entity detail sheet floating rail standard`

---

## Step 3 — Миграция entity sheets (по одному checkpoint + commit)

Порядок: сначала уже правильные (быстрая проверка), потом без rail.

### 3a — Уже с rail (рефактор только на shell)

- [ ] `InvoiceSheet.tsx` (если не в Step 1)
- [ ] `LeadSheet.tsx`
- [ ] `DealSheet.tsx`
- [ ] `SubscriptionDetailSheet.tsx`
- [ ] `SupportTicketDetailSheet.tsx`
- [ ] `CompanySheet.tsx`
- [ ] `ContactSheet.tsx`
- [ ] `TaskSheet.tsx` (проверить свой anchor class — свести к `width` map или явный override prop)
- [ ] `DeliveryItemDetailSheet.tsx`
- [ ] `PartnerDetailSheet.tsx` (если entity detail)

**После 3a:** `[review]` — открыть Lead + Invoice + Deal, убедиться rail и blur одновременно, anchor на sm+ совпадает с шириной панели.

### 3b — Без rail сегодня (добавить стандарт)

- [ ] `ClientServiceDetailSheet.tsx` — `width="medium"`, `sourcePageHref` из deep-link constant
- [ ] Остальные finance/support sheets по мере появления в `desigen.todo.md`

### 3c — Спец. случаи (решение по месту)

- [ ] `checklist-instance-workbench-sheet.tsx` — shell или documented exception
- [ ] `WorkSpaceDriveSheet.tsx` — workspace layout; rail optional / custom anchor
- [ ] `DriveDetailPanel.tsx` — не entity card pattern; оставить `SheetContent` или отдельный `DriveSheetContent`

**Acceptance Step 3:**

- [ ] Ни один entity detail sheet из списка 3a/3b не собирает `floatingClose` + `floatingRail` вручную.
- [ ] Нет расхождения anchor vs width (визуально кнопки на левом краю панели).

---

## Step 4 — Защита от регрессий

- [ ] ESLint rule или codemod-comment (опционально): в `features/**/**Sheet.tsx` запретить прямой `floatingClose` без shell — или grep в CI checklist.
- [ ] Storybook / dev note (опционально): один пример wide + compact с rail.

---

## Step 5 — Done

- [ ] Все целевые entity sheets на `EntityDetailSheetContent`.
- [ ] Canon обновлён.
- [ ] `desigen.todo.md` shared UI list включает `EntityDetailSheetContent`.
- [ ] Product review: Close всегда; Copy/Open там где есть deep link; модульные кнопки только через `trailingRail`.

---

## Не в scope этого плана

- Перестройка контента вкладок / полей (см. `desigen.todo.md` Steps 1–6).
- Stage-gate логика (отдельный roadmap).
- Полная унификация Drive / nested workbench UX.

---

## Быстрый чеклист для нового sheet

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <EntityDetailSheetContent
    open={open}
    width="wide"
    sourcePageHref={`/module/entities?open=${id}`}
    workspaceHref={workspaceUrl}
    trailingRail={<CustomButton />}
  >
    {/* header, tabs, ScrollArea, footer */}
  </EntityDetailSheetContent>
</Sheet>
```

- `Close` — не добавлять вручную.
- `Copy link` / `Open` / `Dashboard` — не дублировать кастомными кнопками, если хватает props.
- Голый `SheetContent` — только non-entity surfaces.
