# Blanking leftover — close one by one

Контракт: `docs/architecture/data-loading-and-refresh.md`
`DataView` + `useRevalidationState` + keep stale on transient error + clear on 401/403/404 + banner.

## Уже закрыто

- [x] Expenses board (Pay Now)
- [x] Product finance expenses
- [x] Expense plans (list / board / coverage grid)
- [x] Bonus board
- [x] Recurring tasks
- [x] Project participants
- [x] Payroll runs list
- [x] Salary board
- [x] Finance dashboard
- [x] Product finance invoices / orders

## Осталось закрыть (очередь)

1. [x] Drive file board — `DriveWorkspace` / `DriveFileSurface`
2. [x] Drive virtual folder grid — `DriveLibraryVirtualFolderGrid`
3. [x] Entity drive preview — `EntityDriveFilesPanel`
4. [x] Calendar day event list — `app/(app)/calendar/page.tsx`
5. [x] Marketing accounts — `use-marketing-settings-data` / `MarketingAccountsSection`
6. [x] Integrations registry — `app/(app)/settings/integrations/page.tsx`
7. [x] Roles / seats grid — `RolesSeatsWorkspace`
8. [x] Partner detail cards — Accruals / Outbound / Analytics / Commission
9. [x] Finance reports — `app/(app)/finance/reports/page.tsx`
10. [x] Credentials vault table/tiles (filter refetch)
11. [x] Settings lists — `app/(app)/settings/lists/page.tsx`
12. [x] Mail thread detail — `MailThreadDetailContent`
13. [x] Product participants — `ProductParticipantsSection`

## После каждого экрана

- [x] Ревью: loading не снимает уже показанные строки
- [x] Typecheck / lint / Prettier по тронутым файлам
- [x] Отметить пункт выше

## Финал

- [x] Независимый проход по оставшимся `if (loading) return <LoadingState`
- [x] Короткий итог в этом файле

## Итог

Очередь закрыта. Все 13 экранов переведены на `DataView` + `useRevalidationState`: refetch/filter/save не снимают уже показанные строки; 401/403/404 чистят данные; transient error держит stale + `ListMutationErrorBanner`.

Grep `if (loading) return <LoadingState` / `loading ? (<LoadingState` по `apps/web/src` — совпадений нет.

Не трогали: диалоги первого открытия (`DriveFolderPickerDialog` и т.п.), узкие панели вроде `DriveDetailPanel` / grants, если они не входили в очередь и не матчили запрещённый паттерн.

Проверки: Prettier по тронутым файлам, `pnpm typecheck` в `apps/web` (ok), eslint по тронутым файлам (ok после фикса unused import + `loadAll` deps).
