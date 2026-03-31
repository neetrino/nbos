# Пошаговый план дальнейших действий (продукт + документация + код)

**База:** `PRODUCT-ENTITY-GIT-ANALYSIS.md`, `00-Documentation-Hub.md`, закрытый Q1 по Product и Hub.

---

## Фаза A — Документация (закрыть пробелы по дельте)

1. Пройти `00-Delta-New-Description.md` § 3 по оставшимся пунктам (лиды On Hold, Deal-ассистент, минимумы инвойсов, Remember payments, бонусы 80/20 vs текущая модель).
2. Выровнять `02-Modules/01-CRM/*` и Finance с четырьмя Deal Type там, где ещё встречаются устаревшие «New / Upsell» как тип сделки.
3. Дополнить `02-Project-Hub-Overview.md` и `03-Products-and-Extensions.md` ссылками на `05-Product-Centric-Navigation.md` и сценарии восстановления Product в коде.
4. Обновить `PROGRESS.md` и при необходимости `DEVELOPMENT_PLAN.md` после завершения фазы A.

---

## Фаза B — Модель данных и миграции

1. Спроектировать **возврат** сущностей `Product` и `Extension` (или эквивалент по § 1.1 Core Entities) **без** слепого `git revert` коммита `02e2575`.
2. Подготовить Prisma-миграцию и связи `Order` ↔ `Product` / `Extension`, согласованные с Deal Type и Product Type.
3. Перенести/убрать дубли с полей `Deal` (`pmId`, `deadline`, `productType`), когда логика снова на Product.

---

## Фаза C — API

1. Восстановить или заново реализовать модули `products` / `extensions` в NestJS.
2. Задачи: сохранить `TaskLink`, добавить стабильную привязку задач к `productId` где нужно.

---

## Фаза D — Frontend (Project Hub)

1. Реализовать навигацию по § 0 `03-Project-Hub-Pages.md` и `05-Product-Centric-Navigation.md`: оболочка проекта → список Product → страница Product с вкладками.
2. Кнопка «Посмотреть всё» / агрегат — по необходимости после MVP (фаза D2).

---

## Фаза E — Регрессия и чистка

1. Прогнать типы, линтер, ключевые сценарии CRM → Order → Project.
2. Обновить `00-Delta-New-Description.md`: закрытые строки помечать выполненными.

---

**Версия:** 1.0  
**Дата:** 2026-03-31
