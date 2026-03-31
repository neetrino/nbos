# TODO — NBOS Platform

> Актуальный список задач и открытых вопросов.
> Последнее обновление: 2026-03-31

---

## Фаза B.5 — Чистка списков (SystemList) ← ПЕРЕД ФАЗОЙ C

> Списки — не просто текст для dropdown. Каждый пункт списка — это параметр,
> от которого зависит поведение системы (поля, валидация, автоматика).
> Нужно привести списки в порядок, убрать лишнее, убрать свободное
> редактирование из админки.

### Проблемы сейчас

1. **SystemListOption дублирует Prisma enum.** Deal Type, Payment Type,
   Extension Size — уже зашиты как enum в БД. SystemList с теми же кодами —
   лишняя копия. Рассинхрон неизбежен.
2. **Product Type — рассинхрон.** Prisma enum: 7 значений (WEBSITE, MOBILE_APP,
   CRM, LOGO, SMM, SEO, OTHER). SystemList seed: 12 значений (добавлены
   WEB_APP, ECOMMERCE, SAAS, LANDING, ERP). Auto-tasks шаблоны: ключи WEB_APP,
   MOBILE_APP, DESIGN, ERP_MODULE, INTEGRATION, OTHER — не совпадают ни с enum,
   ни с seed.
3. **Админка позволяет свободно добавлять/удалять/менять.** Это опасно: если
   кто-то удалит PRODUCT из Deal Type, логика сломается. Списки с привязанным
   поведением нельзя редактировать произвольно.

### Задачи

- [ ] **Решить: enum-only vs SystemList-only vs гибрид** для каждого списка
  - Deal Type (4 значения, жёсткая логика) → скорее всего enum-only
  - Payment Type (2 значения) → enum-only
  - Extension Size (4 значения) → enum-only
  - Product Type (расширяемый) → нужно решить
- [ ] **Синхронизировать Product Type** — один источник правды:
  - Выровнять Prisma enum, SystemList seed, auto-tasks шаблоны
  - Решить: какие типы реально нужны (WEBSITE vs WEB_APP, нужен ли LANDING, ERP)
- [ ] **Убрать из админки CRUD для системных списков** — списки с привязанным
      поведением (Deal Type, Payment Type, Extension Size) не должны
      редактироваться через UI. Максимум: менять label и sortOrder.
- [ ] **Удалить из БД дубли** — если список = enum, записи SystemListOption
      для него не нужны (или нужны только для UI labels)
- [ ] **Документировать** — для каждого списка записать:
      какие действия привязаны к каждому значению (карта из § 4 Core Entities)

---

## Фаза C — API

- [ ] Prisma migrate dev — создать миграцию для Product/Extension
- [ ] Products CRUD модуль (NestJS): create, read, update, delete, stats
- [ ] Extensions CRUD модуль (NestJS): create, read, update, delete
- [ ] Stage gate валидация для Product (NEW→CREATING→DEVELOPMENT→QA→TRANSFER→DONE)
- [ ] Stage gate валидация для Extension (NEW→DEVELOPMENT→REVIEW→DONE)
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
- [ ] Auto-tasks: выровнять ключи шаблонов с ProductTypeEnum
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
- [ ] ProductTypeEnum — оставить enum или перейти на чисто-справочный String + SystemList
- [ ] Data migration: есть ли Orders с type=SUBSCRIPTION в текущей БД?
- [ ] Auto-tasks ключи: WEB_APP в шаблонах vs WEBSITE в ProductTypeEnum — унифицировать
- [ ] Бонусы: правило 80/20 (продажник/ассистент) vs текущая модель по KPI — решить
- [ ] Remember Client Payments — новый подмодуль (не описан в коде)
- [ ] Deal assistant (второй продажник) — не реализован
