# NBOS Tasks — статус

Канон: [01](docs/NBOS/02-Modules/05-Tasks/01-Task-System-Overview.md) · [02](docs/NBOS/02-Modules/05-Tasks/02-Work-Spaces-and-Views.md) · [05](docs/NBOS/02-Modules/05-Tasks/05-Task-Card-UX-Plan.md) · [04](docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md)

## Сделано (Plan A, 2026-05-18)

- ~~Scrum daily board: при `scrumEnabled` на Board/List только `ACTIVE_SPRINT` (без backlog / future sprint)~~
- ~~TaskSheet: inline **Status** (без отдельной кнопки Review)~~
- ~~UI-spec: `/tasks` + вкладки вместо `/tasks/my` и `/tasks/all`~~
- ~~Phase 4 foundation: Work Space runtime, completion rules, local notes в sheet~~

**MVP backlog Tasks — не блокер.**

---

## Deferred

- Sprint / Scrum planning UI (backlog, future sprint views)
- Reviewer approve / request-changes runtime
- Prisma enum cleanup (`NEW` / `DONE` legacy)
- Project-level TasksTab → full Work Space refactor
- Recurring scheduling depth, automation vs blueprints split

---

## Следующий модуль

- [ ] **Support** (или polish Tasks по запросу)
