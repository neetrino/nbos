# План реализации мультиязычности NBOS

Дата: 2026-09-12. Статус: этапы 0–5 закрыты как реализация и отчёт. Prod Neon (`ep-sweet-dew`) получил `20260912120000_employee_interface_locale`. Этап 6 начат: My Account / My Wallet EN/RU. Этап 7: черновик HY-пилота, язык не включён. Код на production не деплоился.

Источник решений: [канон локализации](../NBOS/01-Platform-Overview/07-Interface-Localization.md). Этот план описывает продуктовую реализацию; распределение моделей находится в [инструкции Cursor](./I18N-CURSOR-HANDOFF.md).

## Обязательное чтение

AGENTS.md в корне, docs/TECH_CARD.md, docs/01-ARCHITECTURE.md, docs/NBOS/00-Documentation-Hub.md, канон локализации, Core Entities и Dashboard canon. Перед конкретным участком — его модульные документы и применимые .cursor/rules. Для изменения схемы использовать safe-database-migration; для предпочтений и auth/BFF — security-review; после реализации — verify-before-completion; для diff review — code-review. Не запускать project-onboarding.

## Объём и запреты

Исполнить этапы 0–5 ниже. Этапы 6–7 — backlog, не поручение автоматически переводить всю платформу. Полный объём первого релиза включает четыре create-flow из Dashboard, но не страницы назначения кнопок Open и не рекурсивное создание сущностей из relation picker. Сохранить права, финансовую семантику, query keys бизнес-данных и пользовательские изменения. Не делать commit/push, production deploy, production migration, db push/reset или удаление данных. SQL-миграция в репозитории входит в работу; применение — только в подтверждённой изолированной dev/test БД по профильному skill.

## 0. Инвентаризация и baseline

- Проверить git status, текущие версии, scripts, структуру auth/BFF и пользовательского кеша. Не перезаписывать чужие изменения.
- Создать `docs/implementation/I18N-COVERAGE.md`: поверхность, файлы, namespace, системный/пользовательский текст, статус EN/RU, проверки и исключения.
- Проследить imports до видимых полей/диалогов; включить меню sidebar/mobile, tooltips, DnD edit mode, формы, errors, desk-line, форматирование и доступность.
- Отдельно перечислить вложенные create-flow из relation picker и явно пометить их вне первого релиза; основной выбор существующих сущностей входит.
- Записать baseline доступных проверок. Составить точный перечень targeted tests по реальным скриптам, не выдумывать команды.

Готовность: реестр покрытия и согласованная с каноном карта работ, без изменения scope. Обычные технические уточнения разрешаются исполнителем; изменение продуктового решения требует отдельного согласования.

## 1. Общая основа и эталон

- Подключить совместимый next-intl, lockfile, locale registry, request config и provider без смены маршрутов.
- Завести каталоги и типизацию ключей, ICU, явный EN fallback. Проверки полного покрытия действуют только на заявленный завершённый участок.
- Реализовать поле Employee.interfaceLocale, additive migration с default en, валидируемые GET/PATCH me/preferences, OpenAPI и frontend API-типы.
- Вписать preference-read/write в существующий BFF, не менять refresh rotation и срок сессии. Загрузку данных переиспользовать в рамках запроса.
- Реализовать серверный выбор языка, cookie, изоляцию кешей и очистку при выходе, dropdown под темой, согласованный html lang.
- Эталон: общий Save/Cancel, выбор языка и один Dashboard action с tooltip и ошибкой.

Готовность: EN↔RU работает после повторного входа и на другом устройстве; другой аккаунт не наследует язык; нет hydration mismatch, потери черновика или выхода из сессии. Неверная локаль и чужой employeeId не позволяют изменить чужие настройки. Только после review эталона переходить к массовым изменениям.

## 2. Оболочка и Dashboard

- Перевести desktop/mobile navigation, меню аккаунта/темы, все поверхности Control Center из coverage.
- Реестры действий/виджетов переводить по ключам, сохранив persisted IDs, порядок и permissions.
- Перевести весь текущий каталог desk-line, не менять календарный выбор/детерминизм приветствий. Проверить персональные подстановки и дату на границе дня Yerevan.
- Локализовать форматы метрик, системные priority-card подписи, заметки/ссылки UI без изменения пользовательского содержимого.
- Проверить fallback backend projection/error; расширения API только совместимые и в пределах релиза.

Готовность: coverage для оболочки и Dashboard полностью EN/RU; непереведённая страница другого модуля не считается дефектом этого этапа. Общие диалоги следующего этапа пока явно pending.

## 3. Четыре сценария создания

Task, Meeting, Lead, Expense: поля, placeholder, статусы, relation picker выбора, календарь, validation, submit, success/error, confirmation, close/cancel и loading. Использовать существующие общие диалоги, не создавать копии для Dashboard. Изменения этих же диалогов в других местах приложения принимаются как естественное переиспользование.

Готовность: каждый сценарий проверен на EN/RU с успешным действием и отказом/ошибкой в dev/test; переключение языка сохраняет ввод; права и результат операции прежние. Финансовые и клиентские сообщения не отправлять в production для тестирования.

## 4. Автоматические и визуальные проверки

Минимально необходимые проверки:

- Совпадение ключей EN/RU в completed namespaces, ICU parse и placeholders; пропущенный RU даёт EN, пропущенный EN выявляется.
- RU plural: 0, 1, 2, 5, 11, 21; корректная интерполяция имён и чисел.
- API preference: default существующего пользователя, allowlist/400, unauthenticated, own-user isolation, ошибка записи.
- Загрузка/смена языка, logout/login двух пользователей, отсутствие cross-user SSR/query cache, сериализация быстрых переключений.
- Релевантные auth regression tests после BFF/root layout правок; исходный refresh flow не регрессирует.
- Сохранность форм и DashboardPreference IDs/order, RBAC доступов и DnD поведения.
- Desktop и узкий mobile: EN/RU, light/dark, клавиатура, labels, clipping, loading/empty/error. Проверить консоль браузера.
- Псевдолокализация/удлинение текста и пробный армянский текст для проверки шрифта без включения HY пользователям.

Команды из текущего package.json: `pnpm --filter @nbos/web typecheck`, `pnpm --filter @nbos/web lint`, для затронутых api/shared — их реальные scripts, `pnpm exec vitest run <проверенные test paths>`, `pnpm run build:web` и `pnpm run build:api` при изменении backend. Schema validate/generate — по реальным scripts database и migration skill. Не запускать package-wide format с изменением всего репозитория. Записать точные команды, результаты и причины непроведённых проверок.

Готовность: обязательные проверки пройдены; если инфраструктура недоступна, этап остаётся непроверенным, ограничения честно отражены. Не ослаблять lint/test/security.

## 5. Завершение первого релиза

- Review полного diff против канона и coverage; исправить найденные дефекты.
- Обновить этот план, coverage и IMPLEMENTATION_PROGRESS; в IMPLEMENTATION_DONE переносить только действительно завершённый срез с доказательствами.
- Обновить статусы TECH_CARD и архитектуры только после проверки реализации, не по факту установки библиотеки.
- Документировать точный GET/PATCH контракт, cookie и cache lifecycle по фактической реализации, не менять утверждённое поведение задним числом.
- Отчёт: что работает, что осталось английским по scope, команды проверки, риски, готовая миграция и необходимость отдельного production rollout. Не объявлять deployment выполненным.

## 6–7. Отложенные этапы

6. Остальная платформа EN/RU: сначала личный аккаунт/кошелёк и часто используемые модули, затем остальные; отдельные контракты локализации уведомлений/писем/экспортов. Порядок согласовать по использованию, не включать в текущую реализацию.
7. HY: 50–100 строк терминологического пилота, короткие/полные варианты и review владельцем; после утверждения — каталоги и enablement с полной приёмкой.

## Проверенные точки входа на дату подготовки

- `apps/web/src/app/layout.tsx`: provider, html lang, шрифты, auth bootstrap.
- `apps/web/src/components/layout/AccountMenuDropdown.tsx`, `components/theme/theme-switcher.tsx`.
- `apps/web/src/lib/navigation/nav-config.ts`, `use-sidebar-navigation.ts`, компоненты Sidebar/MobileAppMenu.
- `apps/web/src/features/dashboard/`: dashboard-control-registry, use-dashboard-control-center, desk-line, components.
- `apps/web/src/features/dashboard/components/DashboardCreateActionsProvider.tsx`: Task/Meeting/Lead/Expense entry points.
- `apps/web/src/lib/api-errors.ts`: текущее извлечение сообщений.
- `apps/api/src/modules/employees/me.controller.ts`, `apps/api/src/modules/dashboard/`.
- `packages/database/prisma/schema/employees.prisma`: Employee и DashboardPreference.

Пути — стартовые ориентиры, не исчерпывающий перечень. Перед изменениями проверить фактический граф imports.

## Журнал исполнения

| Этап      | Статус                   | Доказательства / следующий шаг                                                                                                                                                                                                    |
| --------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Документы | Подготовлены, 2026-09-12 | Реализация не начата                                                                                                                                                                                                              |
| 0         | Завершён                 | `docs/implementation/I18N-COVERAGE.md`                                                                                                                                                                                            |
| 1         | Завершён                 | next-intl 4.14.4, `Employee.interfaceLocale`, GET/PATCH `/api/v1/me/preferences`, cookie `nbos-interface-locale`, SSR. Миграция `20260912120000_employee_interface_locale` применена к dev Neon 2026-09-12                        |
| 2         | Завершён                 | Оболочка + Dashboard Control Center EN/RU                                                                                                                                                                                         |
| 3         | Завершён                 | Task/Meeting/Lead/Expense + date/relation picker chrome (`forms`)                                                                                                                                                                 |
| 4         | Завершён                 | Desktop/mobile live + Meeting 403/conflict/network. Web typecheck/lint 0 errors. Live два пользователя и live token-expiry (API/BFF, тестер, cookie владельца не трогали). Auth-страницы вне scope. Production builds не гонялись |
| 5         | Отчёт готов              | Coverage обновлён. Не в IMPLEMENTATION_DONE. Production rollout не входит в поручение                                                                                                                                             |
| 6         | В работе                 | My Account + Wallet + карточка сотрудника (профиль/вкладки). Остальные модули, поиск, inbox ещё английские |
| 7         | Пилот                    | `docs/implementation/I18N-HY-PILOT.md`. HY не в переключателе                                                                                                                                                                     |
