# Пошаговый план дальнейших действий (продукт + документация + код)

**База:** `PRODUCT-ENTITY-GIT-ANALYSIS.md`, `00-Documentation-Hub.md`, закрытый Q1 по Product и Hub.

---

## Фаза A — Документация (закрыть пробелы по дельте)

1. Пройти `00-Delta-New-Description.md` § 3 по оставшимся пунктам (лиды On Hold, Deal-ассистент, минимумы инвойсов, Remember payments, бонусы 80/20 vs текущая модель).
2. ~~Выровнять `02-Modules/01-CRM/*` и Finance с четырьмя Deal Type~~ → **частично выполнено** в Фазе B (код, constants).
3. ~~Дополнить `02-Project-Hub-Overview.md` и `03-Products-and-Extensions.md`~~ → связи зафиксированы в схеме; навигация — Фаза D.
4. ~~Обновить `PROGRESS.md` и при необходимости `DEVELOPMENT_PLAN.md`~~ → выполнено.

---

## Фаза B — Модель данных и миграции ✅

> Коммит: `eb32366` (2026-03-31)
> Подход: «restoration forward» — новая Prisma-схема + обновление кода.

1. ~~Спроектировать возврат Product и Extension~~ → **Выполнено.** Модели `Product`, `Extension` добавлены в `schema.prisma` с полными связями.
2. ~~Подготовить Prisma-схему и связи Order ↔ Product / Extension~~ → **Выполнено.** Order: unique FK `productId` / `extensionId`. DealTypeEnum и OrderTypeEnum приведены к канону (4 типа).
3. ~~Перенести дубли с Deal~~ → **Отложено (deprecated).** Поля `Deal.pmId`, `Deal.deadline`, `Deal.productType` оставлены как deprecated; будут удалены когда Product UI полностью заработает.

**Также выполнено:**

- Task: опциональные FK `productId`, `extensionId` (параллельно с TaskLink)
- SupportTicket: FK `productId`
- Seeds, system-lists, shared constants, web constants — обновлены
- API: orders service, deals pipeline, lead-conversion — адаптированы
- Web: DealCard, CreateDealDialog, DealTasksTab — обновлены
- Build: 0 TS ошибок, 0 lint ошибок

**Ожидает:**

- `prisma migrate dev` — создать миграцию перед деплоем
- Если в БД есть Orders с `type = SUBSCRIPTION` — нужна data migration

---

## Фаза C — API ← **СЛЕДУЮЩАЯ**

1. Восстановить или заново реализовать модули `products` / `extensions` в NestJS (CRUD, stage gates, фильтры).
2. Задачи: сохранить `TaskLink`, добавить стабильную привязку задач к `productId` через API.
3. Авто-задачи по шаблону при создании Product (уже есть templates из Фазы 3.4).

---

## Фаза D — Frontend (Project Hub)

1. Реализовать навигацию по § 0 `03-Project-Hub-Pages.md` и `05-Product-Centric-Navigation.md`: оболочка проекта → список Product → страница Product с вкладками.
2. Кнопка «Посмотреть всё» / агрегат — по необходимости после MVP (фаза D2).

---

## Фаза E — Регрессия и чистка

1. Прогнать типы, линтер, ключевые сценарии CRM → Order → Project.
2. Обновить `00-Delta-New-Description.md`: закрытые строки помечать выполненными.
3. Удалить deprecated поля с Deal (pmId, deadline, productType).

---

**Версия:** 2.0  
**Дата:** 2026-03-31
