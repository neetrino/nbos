# NBOS Work Plans — index

> Обновлено: 2026-06-02

## Архив

| План                                                                                  | Статус                                                               |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [2.todo-Credentials.archived.md](./docs/archive/todos/2.todo-Credentials.archived.md) | **MVP complete** — vault, Sheet, manual access, security canon, bulk |

## Активно

| План                                   | Фокус                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| [1.todo-Access.md](./1.todo-Access.md) | Platform Access **Phase 2** — reuse в Drive/Finance/Tasks + Settings audit UX |

## Что дальше (по приоритету)

1. **Access — Slice F:** зафиксировать и внедрить контракты доступа для Drive, Finance, Project Hub/Tasks (не дублировать Credentials-логику).
2. **Access — Slice C:** UI change reason / audit trail при правках Role & Personal Access Levels в Settings.
3. **Access — Slice D:** вынести manual `ResourceAccessGrant` pattern за пределы Credentials (док + enforcement hooks).
4. **Credentials (backlog, по запросу):** расширенные фильтры vault (`productId`, client, period), CSV import, saved views, Bitrix migration — см. архивный план.

## Канон и прогресс

- Roadmap: `docs/NBOS/00-Implementation-Roadmap.md`
- Статус по модулям: `docs/IMPLEMENTATION_PROGRESS.md`, `docs/IMPLEMENTATION_DONE.md`

## Почему split

Access — платформенная модель; Credentials стал первым потребителем foundation. Следующие модули должны переиспользовать те же primitives (`ProjectTeamMember`, `ProductTeamMember`, `ResourceAccessGrant`, role/personal policies).
