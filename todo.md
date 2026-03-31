# TODO — NBOS Platform

> Актуальный список задач и открытых вопросов.
> Последнее обновление: 2026-03-31

---

## Фаза B.5 — Чистка списков (SystemList) ✅

- [x] Аудит: собрать все enum + SystemList + constants + auto-tasks шаблоны
- [x] Решить для каждого: DEAL_TYPE, PAYMENT_TYPE, EXTENSION_SIZE → enum-only
      (удалены из SystemList). PRODUCT_TYPE → SystemList + Prisma enum (гибрид).
- [x] Синхронизировать ProductType: Prisma enum расширен до 12 значений,
      все constants (shared, dealPipeline, projects, leadPipeline INTEREST_TYPES)
      приведены к единому набору
- [x] Auto-tasks шаблоны: ключи приведены к ProductTypeEnum
      (WEB_APP, WEBSITE, MOBILE_APP, CRM, ECOMMERCE, SAAS, LANDING, ERP,
      LOGO, SMM, SEO, OTHER) — у каждого типа свой набор задач
- [x] Ограничить админку: Settings → Lists показывает только PRODUCT_TYPE,
      только редактирование label/sortOrder/active, без создания/удаления
- [x] Удалить из seed: DEAL_TYPE, PAYMENT_TYPE, EXTENSION_SIZE записи
- [x] Исправить рассинхрон TASK_STATUSES в shared constants
      (было BACKLOG/TODO/REVIEW, стало NEW/IN_PROGRESS/DONE/DEFERRED/CANCELLED)
- [x] Build: 0 TS ошибок, тесты 8/8 проходят

---

## Фаза C — API ← СЛЕДУЮЩАЯ

- [ ] Prisma migrate dev — создать миграцию для Product/Extension
- [ ] Products CRUD модуль (NestJS): create, read, update, delete, stats
- [ ] Extensions CRUD модуль (NestJS): create, read, update, delete
- [ ] Stage gate валидация для Product (NEW→CREATING→DEVELOPMENT→QA→TRANSFER→DONE)
- [ ] Stage gate валидация для Extension (NEW→DEVELOPMENT→QA→TRANSFER→DONE)
- [ ] API: привязка задач к Product/Extension (через FK + TaskLink)
- [ ] API: авто-задачи при создании Product (шаблоны по ProductType)

## Фаза D — Frontend Product Hub

- [ ] Product-centric навигация: Project → Products list → Product page
- [ ] Products/Extensions страницы с вкладками
- [ ] Creating board (стадии продукта)

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

- [ ] Deal.productType/pmId/deadline — когда удалить deprecated поля (после Product UI)
- [ ] Data migration: есть ли Orders с type=SUBSCRIPTION в текущей БД?
- [ ] Бонусы: правило 80/20 (продажник/ассистент) vs текущая модель по KPI — решить
- [ ] Remember Client Payments — новый подмодуль (не описан в коде)
- [ ] Deal assistant (второй продажник) — не реализован
