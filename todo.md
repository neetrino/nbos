# Entity Detail Sheet Shell — Floating Rail Standard

`[ ]` open · `[x]` done · `[review]` waiting for visual approval

**Цель:** один NBOS-слой для entity detail sheets — панель + blur + floating rail без ручной сборки в каждом модуле.

**Решение:** `EntityDetailSheetContent` поверх `SheetContent`.

**Canon:** [`10-Entity-Detail-Sheet-Standard.md`](docs/NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md) · [`entity-detail-sheet-shell.md`](docs/reference/patterns/entity-detail-sheet-shell.md)

**Связь:** [`desigen.todo.md`](desigen.todo.md) — визуальный rollout полей/вкладок.

---

## Step 0 — Подготовка

- [x] Прочитать `sheet.tsx`, `entity-sheet-floating-rail.tsx`, `detail-sheet-classes.ts`.
- [x] Reference: Deal/Invoice vs Client Service (rail добавлен).

---

## Step 1 — Shell-компонент + экспорт

- [x] `EntityDetailSheetContent` (`width`, `open`, `sourcePageHref`, `workspaceHref`, `trailingRail`, `floatingRailContent`, overrides, `showRailActions`, `forceNestedBackdrop`).
- [x] Экспорт + JSDoc.
- [x] `InvoiceSheet` на shell.

---

## Step 2 — Документация canon

- [x] Секция **Floating rail** в `10-Entity-Detail-Sheet-Standard.md`.
- [x] `desigen.todo.md` → `EntityDetailSheetContent`.
- [x] `docs/reference/patterns/entity-detail-sheet-shell.md` (grep checklist, exceptions).

---

## Step 3 — Миграция entity sheets

### 3a

- [x] Invoice, Lead, Deal, Subscription, Support, Company, Contact, Task, Delivery, Partner

### 3b

- [x] ClientServiceDetailSheet
- [ ] Остальные finance/support sheets по мере появления в `desigen.todo.md`

### 3c

- [x] `checklist-instance-workbench-sheet.tsx` — shell при `floatingNav`; иначе `SheetContent` + header close (exception)
- [x] `WorkSpaceDriveSheet.tsx` — shell + `floatingRailContent`
- [x] `DriveDetailPanel.tsx` — shell + `trailingRail` (file actions), 82vw override

**Acceptance Step 3:**

- [x] В `features/**/*Sheet*.tsx` нет `floatingClose` (grep).
- [review] Визуально anchor vs width (Lead, Invoice, Deal, Drive, checklist с nav).

---

## Step 4 — Защита от регрессий

- [x] Grep checklist в `docs/reference/patterns/entity-detail-sheet-shell.md`.
- [ ] Storybook (опционально, не делали).

---

## Step 6 — Два режима ширины (`layout`)

- [x] `layout="full" | "auxiliary"` в `EntityDetailSheetContent` + токены `AUXILIARY` (36rem).
- [x] `full` + `width`: wide / medium / compact (плотность entity detail).
- [x] `auxiliary` — Close-only rail по умолчанию.
- [x] `EmployeeSheet`, `BonusEntryReleasesSheet` → `layout="auxiliary"`.
- [x] `ChecklistInstanceWorkbenchSheet` — только `layout="full"`, `floatingNav` обязателен.

## Step 5 — Done

- [x] Все целевые sheets на shell.
- [x] Canon + engineering reference (layout modes).
- [review] Product review: full (Deal) vs auxiliary (Bonus, HR).

---

## Commits (по запросу)

- [ ] `feat(web): add EntityDetailSheetContent and migrate entity sheets`
- [ ] или разбить feat + docs

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

- Кастомный rail целиком → `floatingRailContent`.
- Bespoke width → `contentClassName` + `railAnchorClassName`.
- Голый `SheetContent` → только exceptions из reference doc.
