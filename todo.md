# NBOS Work Plans — index

> Обновлено: 2026-06-02

## Архив

| План                                                                                  | Статус                                                               |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [2.todo-Credentials.archived.md](./docs/archive/todos/2.todo-Credentials.archived.md) | **MVP complete** — vault, Sheet, manual access, security canon, bulk |

## Активно

| План                                   | Фокус                                                     |
| -------------------------------------- | --------------------------------------------------------- |
| [1.todo-Access.md](./1.todo-Access.md) | Platform Access **Phase 2** — reuse в Drive/Finance/Tasks |

## Что дальше (по приоритету)

1. **Access — Finance:** seller-only boundaries.
2. **Access — Slice D:** reuse contract docs + shared grant resource types.
3. **Access — Slice D:** manual `ResourceAccessGrant` contract для Drive/Finance (док + shared types).
4. **Access — Finance:** seller-only boundaries (не весь finance проекта).
5. **Access — Tasks:** workspace lists без `projectId`; detail auth; Drive multi-link confidentiality.
6. **Drive UX (backlog):** «Copy link» / restricted link — по канону.

## Сделано недавно (Drive Slice F)

- Folder grants API + Share dialog (Credentials-style).
- Наследование доступа папка → файлы (subtree + `buildDriveExplicitFileGrantWhere`).
- Grant count на listing; UI: один badge, cards/tiles/list, fluid tiles grid.

## Канон и прогресс

- Roadmap: `docs/NBOS/00-Implementation-Roadmap.md`
- Статус по модулям: `docs/IMPLEMENTATION_PROGRESS.md`, `docs/IMPLEMENTATION_DONE.md`

## Почему split

Access — платформенная модель; Credentials стал первым потребителем foundation. Следующие модули переиспользуют `ProjectTeamMember`, `ProductTeamMember`, `ResourceAccessGrant`, role/personal policies.
