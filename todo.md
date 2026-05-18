# NBOS Tasks — backlog

Канон: [01](docs/NBOS/02-Modules/05-Tasks/01-Task-System-Overview.md) · [02](docs/NBOS/02-Modules/05-Tasks/02-Work-Spaces-and-Views.md) · [05](docs/NBOS/02-Modules/05-Tasks/05-Task-Card-UX-Plan.md) · [04](docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md)

Phase 4 foundation и Plan A закрыты (2026-05-18). Ниже — только то, что ещё не сделано.

- [ ] **Scrum planning UI** — backlog / future sprint / sprint management (сейчас только `planning_status` в API + фильтр daily board)
- [ ] **Review approve runtime** — approve / request changes, reviewer, уведомления (`requires_review` пока `RUNTIME_NOT_AVAILABLE`)
- [ ] **Prisma enum cleanup** — убрать legacy `NEW` / `DONE` из `TaskStatusEnum`
- [ ] **Recurring UI + scheduling** — web + углубление `computeNextCreateAt`
- [ ] **Automation vs blueprints** — развести `auto-tasks` и launch packs
- [ ] **Legacy tasks без `workspaceId`** — привязка к connected Work Space

---

## Следующий модуль

- [ ] **Support**
