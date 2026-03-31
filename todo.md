# TODO — NBOS Platform

> Актуальный список задач и открытых вопросов.
> Последнее обновление: 2026-03-31

---

## Фаза B — Модель данных ✅

> Коммит: `eb32366` (2026-03-31)

## Фаза B.5 — Чистка списков (SystemList) ✅

> Коммит: `6e13765` (2026-03-31)

## Фаза C — API (Products / Extensions) ✅

> Коммит: `acde752` (2026-03-31)

- [x] Products CRUD модуль (NestJS): controller, service, DTO, module, тесты
- [x] Extensions CRUD модуль (NestJS): controller, service, DTO, module, тесты
- [x] Stage gate валидация Product (NEW→CREATING→DEVELOPMENT→QA→TRANSFER→DONE)
- [x] Stage gate валидация Extension (NEW→DEVELOPMENT→QA→TRANSFER→DONE)
- [x] API: привязка задач к Product/Extension (через FK + TaskLink)
- [x] API: авто-задачи при создании Product (шаблоны по ProductType)
- [x] Build: 0 ошибок, 296 тестов проходят

## Фаза D — Frontend Product Hub ✅

> Коммит: `959761d` (2026-03-31)

- [x] API клиенты Products/Extensions (lib/api)
- [x] Products tab в Project page (карточки с фильтрами)
- [x] Extensions tab в Project page (таблица со status flow)
- [x] Create Product / Extension диалоги
- [x] Product detail page с 4 вкладками (Overview, Tasks, Extensions, Tickets)
- [x] Stage Gate панель на Product Overview
- [x] Навигация: /projects → /projects/[id] → /projects/[id]/products/[productId]
- [x] Build: 0 ошибок, 296 тестов проходят

## Фаза E — Регрессия и чистка ← ТЕКУЩАЯ

- [ ] Удалить deprecated поля Deal (pmId, deadline, productType) из схемы и кода
- [ ] Обновить документацию (PROGRESS.md, roadmap, Delta)
- [ ] Build + тесты: финальная проверка
- [ ] Prisma migrate dev — создать миграцию перед деплоем

---

## Бэклог — List-Driven Behavior (поведенческое влияние списков)

> См. docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md § 4

### Deal Type → поведение

- [ ] Stage gates: разные обязательные поля при переходе стадий для разных DealType
- [ ] PRODUCT → показывать Product Type, при Won создавать Product
- [ ] EXTENSION → показывать связку с существующим Product, при Won создавать Extension
- [ ] MAINTENANCE → специфичные поля (будущее)
- [ ] OUTSOURCE → специфичные поля (будущее)

### Product Type → обязательные поля и автоматика

- [ ] WEBSITE → при Creating обязателен домен, хостинг-credentials
- [ ] MOBILE_APP → при Creating обязательны App Store / Play Store credentials
- [ ] Иконки/визуал продукта в Project Hub зависят от типа

### Marketing / Lead Source → действия

- [ ] PARTNER → автоматически считать комиссию, создать Expense
- [ ] Двухуровневый источник: Level 1 (MARKETING/SALES/PARTNER/CLIENT) → Level 2 (канал)
- [ ] Разные уведомления/действия при разных каналах

### Payment Type → финансовая логика

- [ ] SUBSCRIPTION → авто-генерация Invoice, контроль пауз
- [ ] CLASSIC → минимум первого инвойса (правило 10%)

## Открытые вопросы (для обсуждения по мере продвижения)

- [ ] Data migration: есть ли Orders с type=SUBSCRIPTION в текущей БД?
- [ ] Бонусы: правило 80/20 (продажник/ассистент) vs текущая модель по KPI — решить
- [ ] Remember Client Payments — новый подмодуль (не описан в коде)
- [ ] Deal assistant (второй продажник) — не реализован
