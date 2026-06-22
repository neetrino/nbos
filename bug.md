# Bug: после Mark as Spam лид не находится на `/crm/leads`

> **Создано:** 2026-06-20  
> **Модуль:** CRM → Leads  
> **Путь:** `/crm/leads`  
> **Приоритет:** High (данные «пропадают» из UI, пользователь не может восстановить лид)

---

## Симптом

После перевода лида в **Spam** карточка исчезает с доски. Дальше лид **не виден** — ни в Kanban, ни через поиск, ни через фильтры **Stage = Spam**, **Source** и т.д. Создаётся впечатление, что лид удалён или потерян.

---

## Шаги воспроизведения

1. Открыть `/crm/leads` (по умолчанию: Kanban, фильтр **Status = Active**).
2. Создать или выбрать активный лид.
3. **Mark as spam** (через карточку / sheet / drag в terminal zone Spam).
4. Подтвердить действие.
5. Попробовать найти лид:
   - поиск по имени / email / телефону;
   - фильтр **Stage → Spam**;
   - фильтр **Status → Closed** или **All statuses**;
   - переключение **Board → List**.

---

## Ожидаемое поведение (канон)

По `docs/NBOS/05-UI-Specifications/02-CRM-Pages.md` и `09-Kanban-Board-and-List-Standard.md`:

- **Active** board — только активные стадии pipeline; Spam — terminal outcome, на Active board не показывается (это норма).
- **Closed** board — колонки **Lead Won (SQL)** и **Spam**; spam-лиды должны быть видны.
- **All statuses** — все стадии, включая Spam.
- Фильтр **Stage = Spam** — должен показывать только spam-лиды в любом view.
- Поиск — должен находить лид независимо от стадии (если scope = active, не trash).

После Spam лид остаётся в active lifecycle (не Trash); восстановление в активную стадию — по `lead-stage-gate` / transition matrix.

---

## Фактическое поведение

| Действие пользователя                               | Результат                                                                         |
| --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Default view (Status = **Active**) после Spam       | Лид скрыт — **ожидаемо**, но без подсказки пользователь не понимает, где искать   |
| Фильтр **Stage → Spam** (Status всё ещё **Active**) | Kanban: лид **не отображается** — колонка Spam не строится при scope Active       |
| Поиск по имени (Status = **Active**)                | Лид **не находится** — API может вернуть его, но client-side фильтр отсекает SPAM |
| Фильтр **Status → Closed**                          | Должен работать; UX неочевиден (пользователи не доходят до этого фильтра)         |
| List view + Stage = Spam + Active                   | В List лид **может** появиться, в Kanban — **нет** (расхождение view)             |

Итог: с точки зрения пользователя «ни один фильтр не помогает», особенно если он остаётся в Kanban и не переключает **Status** на Closed.

---

## Техническая причина

### 1. Client-side scope скрывает terminal стадии на Active board

`apps/web/src/app/(app)/crm/leads/page.tsx`:

- `boardScope` по умолчанию = `ACTIVE` (`DEFAULT_BOARD_LIFECYCLE_SCOPE`).
- `displayLeads` отфильтровывает лиды через `matchesBoardLifecycleScope` — SPAM не входит в Active keys.
- Поиск уходит на API (`fetchLeads`), но результат снова фильтруется на клиенте по `boardScope`.

### 2. Фильтр Stage не синхронизирован с колонками Kanban

При `filters.status === 'SPAM'`:

- `displayLeads` включает spam-лиды.
- `kanbanColumns` строится через `buildScopedKanbanColumns` **только по `boardScope`**, без учёта `filters.status`.
- При Active scope колонки Spam не создаются → лиды в `displayLeads` не попадают ни в одну колонку → «пустая» доска без Empty state.

Файлы:

- `apps/web/src/app/(app)/crm/leads/page.tsx` — `displayLeads` vs `kanbanColumns`
- `apps/web/src/features/crm/hooks/buildCrmKanban.ts` — `buildScopedKanbanColumns`
- `apps/web/src/features/shared/board-lifecycle.ts` — `matchesBoardLifecycleScope`, `getBoardStageKeys`

### 3. Та же логика на Deals

`apps/web/src/app/(app)/crm/deals/page.tsx` — идентичный паттерн (Won / Failed).

---

## Предлагаемый fix

1. **При выборе Stage-фильтера на terminal стадию (SPAM, SQL)** — автоматически расширять kanban scope (например `CLOSED` или `ALL`) или строить колонки по выбранной стадии, а не только по `boardScope`.
2. **Поиск** — не применять `boardScope` client-side, если задан non-empty `search` (или если API уже отфильтровал по search).
3. **UX после Mark as Spam** — toast / banner: «Лид закрыт как Spam. Смотрите в **Status → Closed** или фильтр **Stage → Spam**».
4. **Empty state** — если `displayLeads.length > 0`, но ни одна kanban-колонка не содержит items → не показывать «пустую» доску молча; подсказка сменить Status scope.

---

## Acceptance criteria (DoD)

- [ ] После Mark as Spam лид виден при **Status → Closed** в Kanban (колонка Spam).
- [ ] Фильтр **Stage → Spam** показывает лид в Kanban и List при любом Status scope (или auto-switch scope).
- [ ] Поиск по имени/email/phone находит spam-лид без ручного переключения на Closed.
- [ ] После Spam пользователь получает явную подсказку, где смотреть закрытые лиды.
- [ ] Регресс: Active board не показывает spam без явного фильтра / Closed scope.

---

## Связанные файлы

| Файл                                                                  | Роль                                 |
| --------------------------------------------------------------------- | ------------------------------------ |
| `apps/web/src/app/(app)/crm/leads/page.tsx`                           | Фильтры, displayLeads, kanbanColumns |
| `apps/web/src/features/shared/board-lifecycle.ts`                     | ACTIVE / CLOSED / ALL scope          |
| `apps/web/src/features/crm/hooks/buildCrmKanban.ts`                   | Построение колонок                   |
| `apps/web/src/features/crm/constants/leadPipeline.ts`                 | SPAM как `terminal: true`            |
| `docs/NBOS/05-UI-Specifications/02-CRM-Pages.md`                      | UX-канон Closed board                |
| `docs/NBOS/05-UI-Specifications/09-Kanban-Board-and-List-Standard.md` | Scope Active / Closed / All          |
