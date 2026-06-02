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

1. **Access — Slice F:** контракты и enforcement для Drive, Finance, Project Hub/Tasks.
2. **Access — Slice D:** manual `ResourceAccessGrant` за пределами Credentials (док + hooks).
3. **Credentials (backlog):** фильтры vault, CSV, saved views, Bitrix — см. архивный план.

## Канон и прогресс

- Roadmap: `docs/NBOS/00-Implementation-Roadmap.md`
- Статус по модулям: `docs/IMPLEMENTATION_PROGRESS.md`, `docs/IMPLEMENTATION_DONE.md`

## Почему split

Access — платформенная модель; Credentials стал первым потребителем foundation. Следующие модули должны переиспользовать те же primitives (`ProjectTeamMember`, `ProductTeamMember`, `ResourceAccessGrant`, role/personal policies).
