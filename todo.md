# Instant sheet open — план унификации

> **Статус:** **Завершено** — все модули из плана, включая delivery board.

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
- [x] **Delivery board** — header/pipeline/tabs из list `item`; body skeleton + hydrate в фоне

### P2 — sync click + account

- [x] **CRM deals/leads** — click: selected + sheetOpen + URL
- [x] **Clients companies/contacts** — то же
- [x] **HR Team** — openSheet sync
- [x] **Invoices** — deep link seed из list
- [x] **My Account** — sheet открывается сразу, loading state в EmployeeSheet

### Backlog

- [x] **Salary board / payroll run / wallet** — `salary-line-month-detail-placeholder`, `initialDetail`
- [x] **Unit economics** — seed из table row в drilldown sheet
- [x] **EntityItemHost** — instant open + background fetch (invoice/bonus), `initialTask` / `initialExpense`
- [x] **product-finance-expenses-panel** — `initialExpense` из seed
- [x] **product-finance-section** — `initialOrder` / subscription seed из list

### Эталоны (без изменений)

- Invoices (click), Calendar, Credentials, Bonus pool/releases

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
