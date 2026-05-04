# NBOS — проверенный список задач

> Составлено из документов `docs/Mno/task/*` и быстрой проверки текущего кода 2026-05-04.
> Цель файла — оставить только реальные, ещё актуальные задачи, чтобы дальше можно было идти по ним без повторного разбора всех Mno-документов.

---

## Что было проверено

| Проверка                                    | Результат                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `apps/web/middleware.ts`                    | Не найден. Риск auth middleware актуален.                                                              |
| `apps/web/src/proxy.ts`                     | Есть, содержит auth proxy/config, но без `middleware.ts` не подключён как Next middleware.             |
| `/sign-up` route                            | Не найден в `apps/web/src/app/**/sign-up/page.tsx`.                                                    |
| Landing links to `/sign-up`                 | Найдены в `apps/web/src/app/page.tsx`.                                                                 |
| `PermissionContext` error handling          | `catch { /* noop */ }` всё ещё есть.                                                                   |
| `@tanstack/react-query` / `zustand` imports | В `apps/web/src` не найдены, но dependencies есть в `apps/web/package.json`.                           |
| Phase 7 status                              | `docs/IMPLEMENTATION_PROGRESS.md` показывает Phase 7: In progress, 0%, ручной browser smoke ещё нужен. |
| `docs/PHASE_7_PRECHECK_MANUAL_QA.md`        | Файл существует.                                                                                       |
| `vercel.json` / `Dockerfile`                | В repo не найдены.                                                                                     |

---

## P0 — сделать до новой функциональной разработки

1. Пройти ручной browser smoke checklist из `docs/PHASE_7_PRECHECK_MANUAL_QA.md`.
   - Почему: автоматические проверки и API smoke уже отмечены как пройденные, но owner/browser pass ещё pending.
   - Готово, когда: чеклист пройден в logged-in browser session, найденные блокеры записаны отдельными задачами.

2. Подключить Next.js route protection middleware.
   - Проверено: `apps/web/src/proxy.ts` есть, но `apps/web/middleware.ts` отсутствует.
   - Вероятное действие: добавить `apps/web/middleware.ts`, который экспортирует `proxy` и `config` из `src/proxy.ts`, либо перенести middleware logic по актуальному Next/Auth.js pattern.
   - Проверить: unauthenticated `/dashboard` и другие `(app)` routes должны редиректить на `/sign-in?callbackUrl=...`.

3. Исправить broken `/sign-up` CTA на landing page.
   - Проверено: links есть в `apps/web/src/app/page.tsx`, route нет.
   - Решение нужно выбрать по продуктовой логике: если регистрация только по invite, заменить CTA на `/accept-invite`/`/sign-in`/contact flow; если public signup нужен, реализовать route и backend contract.
   - Не менять auth backend contract без отдельного решения.

---

## P1 — безопасность и UX ошибки

4. Добавить нормальную обработку ошибки загрузки `/api/me` в `PermissionContext`.
   - Проверено: сейчас `catch { /* noop */ }`.
   - Действие: хранить error state и показать user-visible сообщение через существующий UI pattern/toast, не ломая permission map format.
   - Проверить: при 401/500/network error пользователь понимает, что это ошибка загрузки прав, а не отсутствие доступов.

5. Проверить список всех `@Public()` endpoints.
   - Источник: `06_AUTH_SECURITY_PERMISSIONS_HY.md`, `09_BUGS_RISKS_AND_FIX_PLAN_HY.md`.
   - Действие: сверить controller decorators/Swagger, отдельно проверить `auth`, `health`, invite endpoints и scheduler triggers.
   - Готово, когда: нет public admin/scheduler/secret endpoints без явного решения и защиты.

6. Подготовить production secrets/env checklist.
   - Источник: `.env.example`, auth/security docs.
   - Действие: зафиксировать обязательные production env значения: `AUTH_SECRET`, `JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `CREDENTIALS_ENCRYPTION_KEY`, R2/Resend при включении.
   - Не добавлять реальные секреты в repo.

---

## P2 — Phase 7 и эксплуатационная готовность

7. Начать Phase 7 только после browser smoke pass.
   - По `docs/IMPLEMENTATION_PROGRESS.md` следующий slice: `integration-registry-foundation`.
   - До старта: не включать Google v2, AI, complex approval workflow, WAHA runtime и credentials secrets без отдельного approval.

8. Добавить deploy documentation или минимальную IaC-конфигурацию.
   - Проверено: `vercel.json` и `Dockerfile` не найдены.
   - Действие: описать deploy flow для Vercel web + Render/Nest API или добавить нужные config files, если это соответствует выбранному deploy path.

9. Проверить scheduler trigger endpoints.
   - Источник: `04_API_AND_DATA_FLOW_HY.md`, `09_BUGS_RISKS_AND_FIX_PLAN_HY.md`.
   - Действие: убедиться, что scheduler endpoints не public и имеют правильные permissions/rate limits.

---

## P3 — технический долг

10. Провести audit unused web dependencies.
    - Проверено: `@tanstack/react-query` и `zustand` есть в `apps/web/package.json`, но imports в `apps/web/src` не найдены.
    - Действие: либо удалить зависимости, либо внедрять осознанно в рамках отдельной задачи.

11. Разделить большой `Sidebar.tsx`.
    - Источник: `07_UI_COMPONENTS_AND_STYLING_HY.md`.
    - Действие: вынести nav config и мелкие subcomponents без изменения поведения.

12. Описать правило владения Prisma migrations.
    - Источник: `09_BUGS_RISKS_AND_FIX_PLAN_HY.md`.
    - Действие: добавить короткое правило для team workflow, чтобы parallel migrations не конфликтовали.

13. Оценить invalidation для RBAC permission cache.
    - Источник: `employee.guard.ts` cache TTL 60s.
    - Действие: решить, достаточно ли текущего TTL, или нужен explicit invalidation после изменения ролей/permissions.

14. Зафиксировать future SSR API auth rule.
    - Источник: `apps/web/src/lib/api.ts` возвращает `null` token server-side.
    - Действие: если появятся server component API calls, использовать explicit server session/auth helper, а не общий browser axios token resolver.

---

## Что не является immediate task

- Большинство модулей CRM, Finance, Projects, Tasks, Support, Drive, Documents, Mail, Messenger, Notifications, Calendar, Dashboard/Reports отмечены как P0/MVP done; без нового bug report не надо переписывать их сейчас.
- Deeper BI для Reports — будущая продуктовая задача, а не текущий баг.
- Storybook — optional, добавлять только если появится отдельная UI/documentation цель.
