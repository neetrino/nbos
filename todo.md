# Finance module UX — plan

> Check off items as completed. Phases are sequential unless noted.

## Phase 1 — Navigation IA (sidebar groups + zone hero tabs)

- [x] Document plan in `todo.md`
- [x] Sidebar: Finance children grouped (Overview, Revenue, Expenses, Payroll, Services, Analytics)
- [x] Add `Salary board` to sidebar (was missing)
- [x] Remove global 13-tab bar from `finance/layout.tsx`
- [x] Zone hero tabs via `ModuleHeroSlotProvider` + `resolveFinanceZoneNav` (CRM-style pills)
- [x] `NavChildDefinition` group labels in sidebar (`kind: 'group' | 'link'`)
- [x] Update `docs/NBOS/05-UI-Specifications/04-Finance-Pages.md` § module navigation

## Phase 2 — Page hero standard (search · filters · view per board page)

- [x] **Invoices:** `useModuleHeroSlots` + `IntegratedSearchFilters` + `ViewModeSwitch`; remove standalone header/filter row
- [x] **Invoices:** remove top analytics block (`InvoiceStatsCards`)
- [x] **Orders:** migrate to module hero slots
- [x] **Payments:** migrate to module hero slots
- [x] **Subscriptions:** migrate to module hero slots + remove stats cards if present
- [x] **Expenses (board):** hero slots; move `ExpenseFinanceSubNav` → `secondaryTabs` in hero
- [ ] **Expenses (plans):** hero slots
- [ ] **Payroll / Salary / Bonus pools:** hero slots
- [ ] **Client services:** hero slots + remove summary card row
- [ ] **Reports / Journal:** hero slots where applicable
- [ ] `/bonus`: share Finance payroll zone hero (route or shared layout)

## Phase 3 — Column analytics (not page-level blocks)

- [x] Invoices kanban: column totals already via `InvoiceKanbanColumnTotal`
- [ ] Expenses kanban: column totals (match CRM screenshot pattern)
- [ ] Other finance boards: column roll-ups where canon applies
- [ ] Decide final placement for module-level KPIs (dashboard only vs none)

## Phase 4 — Finance Dashboard hub

- [ ] Overview page: zone cards + links (no operational tabs)
- [ ] Align with `01-Finance-Overview.md` zones

## Phase 5 — Canon polish (boards, search, stage-gate)

- [ ] Filters/search parity with `09-Kanban-Board-and-List-Standard.md`
- [ ] Invoice list view parity
- [ ] Expense closed/backlog scope banners in hero flow
- [ ] Stage-gate highlights per `11-Finance-Stage-Gate-and-Board-UX-Standard.md`

## Phase 6 — Finance team custom UI (deferred)

- [ ] Vertical action rail top-left (vertical text labels) for finance power users
- [ ] Role-based visibility (Finance Director vs PM)
- [ ] Design review before build
