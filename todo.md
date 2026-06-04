# NBOS Work Plans — index

> Обновлено: 2026-06-02

## Архив

| План                                                                                  | Статус                                                                       |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [1.todo-Access.archived.md](./docs/archive/todos/1.todo-Access.archived.md)           | **Complete** — Platform Access Phase 1 + Phase 2 (Drive/Finance/Tasks reuse) |
| [2.todo-Credentials.archived.md](./docs/archive/todos/2.todo-Credentials.archived.md) | **MVP complete** — vault, Sheet, manual access, security canon, bulk         |

## Активно

_Нет отдельного root todo-плана. Следующие задачи — по модульным cleanup registers и roadmap._

## Что дальше (по приоритету)

1. **Drive:** per-file list menu `allowed-actions` + trash lifecycle — `docs/NBOS/02-Modules/11-Drive/07-Drive-Cleanup-Register.md` §9.
2. **Tasks (optional):** `findByEntity` / checklist access hardening — `docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md` (Platform access).
3. **Drive UX (backlog):** «Copy link» / restricted link — по канону Drive.

## Сделано недавно (Platform Access + Drive)

- Platform Access Foundation Phase 2: Finance seller/payroll, Tasks gates, Drive multi-link + Share/Move/Copy API + detail UI `allowed-actions`.
- Folder grants API + Share dialog; folder→file inherit; grant count на listing.

## Канон и прогресс

- Roadmap: `docs/NBOS/00-Implementation-Roadmap.md`
- Статус по модулям: `docs/IMPLEMENTATION_PROGRESS.md`, `docs/IMPLEMENTATION_DONE.md`

## Почему split

Access и Credentials вынесены в archive после закрытия MVP/Phase 2. Новые scoped-модули опираются на `ProjectTeamMember`, `ProductTeamMember`, `ResourceAccessGrant`, role/personal policies — канон `09-Platform-Access-Foundation.md`.
