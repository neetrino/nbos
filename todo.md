# Instant sheet open — план унификации

> **Цель:** при клике на карточку/строку списка sheet открывается **мгновенно** с данными, которые уже есть на фронте (title, stage, badges, суммы и т.д.). Полная детализация подгружается **в фоне**, без блокировки анимации sheet.

---

## Профессиональный подход (единый для всех модулей)

### Паттерн: Staged hydration (двухфазное открытие)

```
Клик по карточке
  → 1) open=true + seed из list-row (синхронно)
  → 2) push URL (?openEntityId=…) для deep link
  → 3) sheet ренерит header / stage / summary из seed
  → 4) background getById → merge в state (если форма не dirty)
```

**Правило:** sheet **никогда** не ждёт API, чтобы показать shell (header, stage bar, tabs). Spinner/skeleton только в теле вкладок, где данных ещё нет.

### Два слоя ответственности

| Слой             | Где                              | Что делает                                                                                                                   |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Page / hook**  | `*PageContent`, `use*PageState`  | На клик: `setSelected(entity)`, `setSheetOpen(true)`, `pushOpenToUrl(id)`. На deep link: сначала `find` в list, иначе fetch. |
| **Sheet / hook** | `*DetailSheet`, `use*SheetState` | Принимает `initialEntity` / `entity` + опционально `entityId`. Seed → instant UI. `useEffect` → hydrate.                     |

### Контракт sheet (целевой, одинаковый везде)

```ts
interface EntityDetailSheetProps<TList, TDetail extends TList> {
  entityId: string | null;
  initialEntity?: TList | null; // list-row / kanban-card snapshot
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntityUpdated?: (entity: TDetail) => void;
}
```

Если list-DTO ≠ detail-DTO → mapper `*PlaceholderFromListItem(listRow): Partial<TDetail>` (как в Credentials).

### Shared hook (создать при первой миграции P0)

`apps/web/src/hooks/use-entity-detail-hydration.ts`

- input: `{ id, open, initial, fetchById, isDirty? }`
- output: `{ entity, loading, error, refresh }`
- логика: при open + initial → set entity сразу; параллельно fetch; merge если !dirty

### Эталоны уже в кодовой базе (копировать)

| Эталон                      | Файлы                                                                                                     | Что хорошо                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **A+ Credentials Vault**    | `credential-detail-placeholder.ts`, `use-credential-form-sheet-state.ts`, `use-credentials-vault-page.ts` | placeholder из list + background hydrate                                   |
| **A Invoices**              | `useInvoicesPageState.handleInvoiceClick`, `InvoiceSheet`                                                 | клик: entity + open + URL; sheet получает объект                           |
| **A Expenses (page only)**  | `ExpensesPageContent.handleExpenseClick`                                                                  | мгновенный open на page, но sheet ещё refetch — доделать                   |
| **A Calendar**              | `calendar/page.tsx`, `CalendarEventDetailSheet`                                                           | event object на клик; enrich async                                         |
| **A Bonus pool / releases** | `ProductBonusPoolSheet`, `BonusEntryReleasesSheet`                                                        | pool/entry из list                                                         |
| **B CRM / Clients**         | deals, leads, contacts, companies                                                                         | entity в sheet через URL-effect, но клик **только URL** → 1 frame задержка |
| **C Anti-pattern**          | `use-task-sheet-state`, `use-expense-detail`, `OrderDetailSheet`                                          | sheet null до getById → пустой экран / задержка                            |

### Click handler — целевой шаблон (везде одинаково)

```ts
const openEntity = useCallback(
  (row: T) => {
    setSelected(row);
    setSheetOpen(true);
    pushOpenToUrl(row.id);
  },
  [pushOpenToUrl],
);
```

Не полагаться только на `router.push` + `useEffect` для открытия sheet.

### Deep link — целевой шаблон

```ts
useEffect(() => {
  if (!openIdFromUrl) return;
  const fromList = items.find((x) => x.id === openIdFromUrl);
  if (fromList) {
    setSelected(fromList);
    setSheetOpen(true);
    return;
  }
  // fallback fetch для внешней ссылки
}, [openIdFromUrl, items]);
```

---

## Инвентаризация страниц

Легенда: ✅ OK · 🟡 частично · ❌ нужна работа

### P0 — высокий трафик / заметная задержка

| #   | Route                                  | Sheet                      | Статус | Проблема                                                                          | Файлы                                                                       |
| --- | -------------------------------------- | -------------------------- | ------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | `/tasks`, `/tasks/workspaces/*`        | `TaskSheet`                | ❌     | Только `taskId`; `useTaskSheetState` always `getById`; sheet null пока loading    | `use-task-sheet-state.ts`, `WorkSpaceRuntime.tsx`, `use-tasks-list-page.ts` |
| 2   | `/finance/expenses` (+ backlog/closed) | `ExpenseDetailSheet`       | ❌     | Page seed есть (`selectedExpense`), sheet игнорирует — `useExpenseDetail` refetch | `ExpensesPageContent.tsx`, `use-expense-detail.ts`                          |
| 3   | `/finance/orders`                      | `OrderDetailSheet`         | ❌     | Page `selectedOrder` не передаётся; sheet только `orderId`                        | `useOrdersPageState.ts`, `OrderDetailSheet.tsx`                             |
| 4   | `/support` (+ product support tab)     | `SupportTicketDetailSheet` | ❌     | Только `ticketId`; fetch ticket + projects + employees + contacts блокирует       | `use-support-page.ts`, `SupportTicketDetailSheet.tsx`                       |

### P1 — finance / delivery

| #   | Route                      | Sheet                      | Статус | Проблема                                                                        | Файлы                                                          |
| --- | -------------------------- | -------------------------- | ------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 5   | `/finance/expenses/plans`  | `ExpensePlanDetailSheet`   | ❌     | Только `planId`                                                                 | `expense-plans-page-content.tsx`, `use-expense-plan-detail.ts` |
| 6   | `/finance/client-services` | `ClientServiceDetailSheet` | ❌     | URL-only; list в child views, seed не прокидывается                             | `ClientServicesPageContent.tsx`                                |
| 7   | `/finance/subscriptions`   | `SubscriptionDetailSheet`  | ❌     | Только `subscriptionId`                                                         | `subscriptions/page.tsx`                                       |
| 8   | `/partners`                | `PartnerDetailSheet`       | ❌     | Только `partnerId`; list не передаётся                                          | `partners/page.tsx`                                            |
| 9   | `/delivery-board`          | `DeliveryItemDetailSheet`  | 🟡     | `item` из list есть, но UI ждёт `productsApi.getById` / `extensionsApi.getById` | `DeliveryItemDetailSheet.tsx`, `delivery-board/page.tsx`       |

### P2 — CRM / HR / clients (entity уже в sheet, улучшить click)

| #   | Route                | Sheet           | Статус | Проблема                                                                      | Файлы                        |
| --- | -------------------- | --------------- | ------ | ----------------------------------------------------------------------------- | ---------------------------- |
| 10  | `/crm/deals`         | `DealSheet`     | 🟡     | `handleCardClick` только URL; `handleOpenDealById` — правильный async hydrate | `crm/deals/page.tsx`         |
| 11  | `/crm/leads`         | `LeadSheet`     | 🟡     | Клик только URL                                                               | `crm/leads/page.tsx`         |
| 12  | `/clients/companies` | `CompanySheet`  | 🟡     | `handleRowClick` только URL                                                   | `clients/companies/page.tsx` |
| 13  | `/clients/contacts`  | `ContactSheet`  | 🟡     | То же                                                                         | `clients/contacts/page.tsx`  |
| 14  | `/hr/team`           | `EmployeeSheet` | 🟡     | `openSheet(emp)` только URL                                                   | `TeamDirectoryPage.tsx`      |

### P2 — payroll / analytics / account

| #   | Route                        | Sheet                                        | Статус | Проблема                                           | Файлы                             |
| --- | ---------------------------- | -------------------------------------------- | ------ | -------------------------------------------------- | --------------------------------- |
| 15  | `/finance/salary-board`      | `EmployeeMonthCompensationSheet`             | ❌     | Только `salaryLineId`; board row не seed           | `SalaryBoardPageContent.tsx`      |
| 16  | `/finance/payroll/runs/[id]` | `EmployeeMonthCompensationSheet`             | ❌     | То же                                              | `PayrollRunDetailPageContent.tsx` |
| 17  | `/finance/unit-economics`    | `UnitEconomicsDrilldownSheet`                | ❌     | Только `orderId`                                   | `UnitEconomicsPageContent.tsx`    |
| 18  | My Account (global)          | `EmployeeSheet` via `MyAccountSheetProvider` | ❌     | `openMyAccountSheet` ждёт fetch до `setOpen(true)` | `my-account-sheet-provider.tsx`   |

### ✅ Уже хорошо (не трогать, использовать как reference)

| Route               | Sheet                                              | Примечание                               |
| ------------------- | -------------------------------------------------- | ---------------------------------------- |
| `/finance/invoices` | `InvoiceSheet`                                     | entity object + instant open             |
| `/calendar`         | `CalendarEventDetailSheet`                         | event на клик                            |
| `/credentials`      | `CredentialFormSheet`                              | **главный этalon** placeholder + hydrate |
| `/finance/bonus`    | `BonusEntryReleasesSheet`, `ProductBonusPoolSheet` | entry/pool из list                       |

### Embedded / nested (после P0–P1)

| Контекст                          | Sheet                                 | Статус                                    |
| --------------------------------- | ------------------------------------- | ----------------------------------------- |
| Project → Finance tab             | Invoice, Expense, Subscription sheets | проверить после P0 hooks                  |
| Project → Support tab             | Support ticket sheet                  | как #4                                    |
| Project → Tasks tab               | TaskSheet                             | как #1                                    |
| Project → Credentials tab         | CredentialFormSheet                   | ✅                                        |
| Project → Delivery (product page) | DeliveryItemDetailSheet               | как #9                                    |
| Client portfolio embedded         | Company/Contact/Deal sheets           | как P2                                    |
| Drive                             | `DriveDetailPanel`                    | file object на preview — проверить enrich |
| Wallet (account)                  | `employee-wallet-sheet`               | отдельный audit                           |

---

## Фазы реализации

### Phase 0 — инфраструктура (1 PR)

- [ ] `use-entity-detail-hydration.ts` — shared hook
- [ ] Документировать контракт в `apps/web/src/components/shared/entity-detail-sheet-pattern.md` (кратко, 1 screen)
- [ ] Helper `openEntityFromList({ row, setSelected, setOpen, pushUrl })` — optional tiny util

### Phase 1 — P0 модули (4 PR, по одному модулю)

- [ ] **Tasks** — `TaskSheet` + `useTaskSheetState`: prop `initialTask?: Task`; seed header/footer; hydrate checklists/tabs async
- [ ] **Expenses** — `ExpenseDetailSheet`: prop `initialExpense`; refactor `useExpenseDetail` → hydration hook
- [ ] **Orders** — pass `initialOrder` from `useOrdersPageState`; refactor `OrderDetailSheet`
- [ ] **Support** — pass ticket from list; sheet: instant header/triage from seed; defer employees/contacts/projects load

### Phase 2 — P1 finance + delivery (1–2 PR)

- [ ] Expense plans, Client services, Subscriptions, Partners — единый паттерн
- [ ] Delivery board — render header/stages from `DeliveryBoardItem` while `FullProduct` loads

### Phase 3 — P2 click-handler unification (1 PR)

- [ ] CRM deals/leads, Clients, HR team — `openEntity` шаблон (sync open + URL)
- [ ] Deep-link effects: prefer list seed, не блокировать `loading` если item уже в cache

### Phase 4 — payroll / account / unit economics (1 PR)

- [ ] Salary board: seed из board row (employee name, month, amounts)
- [ ] My Account: open sheet сразу с `me` minimal + hydrate employee record
- [ ] Unit economics drilldown: seed из table row если есть

### Phase 5 — embedded contexts + QA

- [ ] Пройти nested sheets (product tabs, portfolio)
- [ ] E2E smoke: click card → sheet visible < 100ms, header populated
- [ ] Deep link из notification → list seed или skeleton, не blank sheet

---

## Чеклист на каждую страницу (DoD)

- [ ] Click handler: `setSelected(row)` + `setSheetOpen(true)` + URL (не только URL)
- [ ] Sheet принимает `initialEntity` / использует list object
- [ ] Header (title, stage, badges) виден до завершения fetch
- [ ] Background fetch не сбрасывает dirty form
- [ ] Deep link: seed из list если id в cache, иначе fetch
- [ ] Закрытие sheet: clear selected + strip URL
- [ ] Nested sheet (`forceNestedBackdrop`) — seed тоже передаётся

---

## Mapper-ы для создания (list → detail placeholder)

| Module         | Функция                                | Файл (создать)                                              |
| -------------- | -------------------------------------- | ----------------------------------------------------------- |
| Task           | `taskDetailPlaceholderFromListItem`    | `features/tasks/utils/task-detail-placeholder.ts`           |
| Expense        | `expenseDetailPlaceholderFromListItem` | `features/finance/utils/expense-detail-placeholder.ts`      |
| Order          | `orderDetailPlaceholderFromListItem`   | `features/finance/utils/order-detail-placeholder.ts`        |
| Support ticket | `supportTicketPlaceholderFromListItem` | `features/support/utils/support-ticket-placeholder.ts`      |
| Expense plan   | `expensePlanPlaceholderFromListItem`   | `features/finance/utils/expense-plan-detail-placeholder.ts` |
| Client service | `clientServicePlaceholderFromListItem` | `features/finance/utils/client-service-placeholder.ts`      |
| Subscription   | `subscriptionPlaceholderFromListItem`  | `features/finance/utils/subscription-detail-placeholder.ts` |
| Partner        | `partnerPlaceholderFromListItem`       | `features/partners/utils/partner-detail-placeholder.ts`     |
| Delivery item  | `deliveryItemPlanningPlaceholder`      | уже частично через `DeliveryBoardItem`                      |

---

## Порядок старта (рекомендация)

1. Phase 0 (hook)
2. Expenses — smallest diff после hook (page уже seed)
3. Tasks — max UX impact
4. Support + Orders
5. Остальное по таблице P1 → P2
