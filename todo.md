# Instant sheet open — план унификации

> **Статус:** Phase 0 + P0 + P1 + P2 (основное) — **реализовано** в коде. Осталось: salary board / unit economics / nested EntityItemHost.

## Реализовано

### Phase 0 — инфраструктура

- [x] `apps/web/src/hooks/use-entity-detail-hydration.ts` — shared hook (staged hydration)
- [x] `apps/web/src/features/tasks/utils/task-detail-placeholder.ts`

### P0 — высокий трафик

- [x] **Expenses** — `initialExpense`, `useExpenseDetail` → hydration hook
- [x] **Tasks** — `initialTask` в `TaskSheet` / `useTaskSheetState`, tasks page + WorkSpaceRuntime
- [x] **Orders** — `initialOrder`, `OrderDetailSheet`, deep link seed из list
- [x] **Support** — `initialTicket`, split ticket fetch / picker loads, Support + Change Control + Product tab

### P1 — finance + delivery

- [x] **Expense plans** — `initialPlan`, `useExpensePlanDetail`
- [x] **Client services** — `initialService`, onOpen передаёт record
- [x] **Subscriptions** — `initialSubscription`, hydration в sheet
- [x] **Partners** — `initialPartner`, hydration в sheet
- [ ] **Delivery board** — header уже из `item`; full product fetch остаётся (частично OK)

### P2 — sync click + account

- [x] **CRM deals/leads** — click: selected + sheetOpen + URL
- [x] **Clients companies/contacts** — то же
- [x] **HR Team** — openSheet sync
- [x] **Invoices** — deep link seed из list
- [x] **My Account** — sheet открывается сразу, loading state в EmployeeSheet

### Эталоны (без изменений)

- Invoices (click), Calendar, Credentials, Bonus pool/releases

---

## Осталось (backlog)

| Route                                 | Задача                                                  |
| ------------------------------------- | ------------------------------------------------------- |
| `/finance/salary-board`, payroll run  | seed salary line row в `EmployeeMonthCompensationSheet` |
| `/finance/unit-economics`             | seed из table row в drilldown sheet                     |
| `EntityItemHost` nested sheets        | прокинуть initial\* где есть list context               |
| `product-finance-expenses-panel`      | `initialExpense` из expense sheet hook                  |
| `product-finance-section` Order sheet | `initialOrder`                                          |

---

## Паттерн (канон)

```ts
// Page click
setSelected(row);
setSheetOpen(true);
pushOpenToUrl(row.id);

// Sheet
<EntityDetailSheet
  entityId={id}
  initialEntity={selectedRow} // или find из list по URL
  ...
/>

// Hook
useEntityDetailHydration({ entityId, open, initialEntity, fetchById, isDirty })
```

**Правило:** header/stage/title из seed сразу; body tabs — skeleton только если нет seed; `getById` в фоне.
