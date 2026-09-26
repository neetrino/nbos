# NBOS — проверенный список задач (архив)

> **Не обновляется.** Актуальный чеклист: `docs/IMPLEMENTATION_PROGRESS.md`.  
> Исторически составлено из `docs/Progress Archive/Mno/task/*` и проверки кода. **Зафиксировано 2026-05-04.**

---

## Статус проверок (2026-05-04)

| Проверка                            | Результат                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/proxy.ts`             | **Единственная точка входа** для auth gate (Next.js 16 `proxy` convention); `/sign-up` в публичных путях. `middleware.ts` не используется.     |
| `/sign-up`                          | **Есть** — `(auth)/sign-up` invite-only страница.                                                                                              |
| Landing                             | Тексты и CTA согласованы с invite-only.                                                                                                        |
| `PermissionContext`                 | Ошибка `/api/me` → `meLoadError`, toast (Sonner), баннер в `Topbar`.                                                                           |
| `Toaster`                           | Смонтирован в root `layout.tsx`.                                                                                                               |
| `@tanstack/react-query` / `zustand` | **Удалены** из `apps/web/package.json` (не использовались).                                                                                    |
| Phase 7                             | Ручная приёмка по блокам — см. **`docs/IMPLEMENTATION_PROGRESS.md`**; архивный чеклист: `docs/Progress Archive/PHASE_7_PRECHECK_MANUAL_QA.md`. |
| Deploy docs                         | **Добавлен** `docs/DEPLOYMENT.md`.                                                                                                             |
| Migrations workflow                 | **Добавлен** `docs/DATABASE_MIGRATIONS_WORKFLOW.md`.                                                                                           |
| `scheduler.controller.ts`           | **Проверено**: нет `@Public()`, требуется Bearer (глобальные guards).                                                                          |
| `vercel.json` / `Dockerfile`        | По-прежнему нет в repo — опционально; см. `docs/DEPLOYMENT.md`.                                                                                |

---

## Осталось до старта Phase 7 (обязательно)

1. **Ручная приёмка** — блоки из `docs/IMPLEMENTATION_PROGRESS.md` (при необходимости см. архив `docs/Progress Archive/PHASE_7_PRECHECK_MANUAL_QA.md`).
2. После прохождения — старт Phase 7 с `integration-registry-foundation` (см. `docs/IMPLEMENTATION_PROGRESS.md`).

---

## Рекомендуется до production (не блокирует Phase 7 в dev)

3. **Production secrets / env** — пройти чеклист в `docs/DEPLOYMENT.md` на staging/production.
4. **Аудит `@Public()`** — периодически сверять со Swagger при добавлении endpoints.
5. **EmployeeGuard cache 60s** — при частой смене ролей оценить TTL или invalidation (низкий приоритет).
6. **SSR + axios** — при появлении server components с API: явная передача токена (см. `04_API_AND_DATA_FLOW_HY.md`).
7. **Техдолг UI** — разбить `Sidebar.tsx`, Storybook по необходимости.

---

## Закрыто в коде / доках (ранее было в списке)

- Подключение Next middleware для защиты маршрутов.
- Исправление broken `/sign-up` (invite-only страница + публичный path).
- Нормальная обработка ошибки `/api/me`.
- Удаление неиспользуемых web-зависимостей react-query / zustand.
- Baseline deploy и workflow миграций в `docs/`.
