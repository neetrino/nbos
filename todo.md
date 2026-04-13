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

## Фаза E — ProductCategory + каскадный выбор ✅

> Коммит: `d85dacc` (2026-03-31)

- [x] ProductCategoryEnum (CODE, WORDPRESS, SHOPIFY, MARKETING, OTHER) в Prisma schema
- [x] Обновлённый ProductTypeEnum (16 значений: +BUSINESS_CARD_WEBSITE, COMPANY_WEBSITE, BRANDING, DESIGN, PPC)
- [x] Каскадный маппинг PRODUCT_TYPES_BY_CATEGORY (shared + frontend)
- [x] productCategory на Deal (optional) и Product (required)
- [x] Каскадный UI: DealGeneralTab, CreateDealDialog, CreateProductDialog
- [x] Обновлены auto-tasks templates, seeds, system lists
- [x] Prisma migration создана (20260331180000_add_product_category_cascade)
- [x] Build: 0 ошибок, 296 тестов проходят

## Фаза F — List-Driven Behavior ← ТЕКУЩАЯ

> Поведение системы на основе значений списков (DealType, ProductCategory, ProductType)

### F.1 — Deal Won → Auto-create Product

- [ ] При переходе Deal в WON: автоматически создать Product из Deal
- [ ] Копирование полей: productCategory, productType, pmId, deadline → Product
- [ ] Автоматическое создание Project (если нет) и привязка
- [ ] Генерация авто-задач для Product по productType

### F.2 — Extension Deal → Product Link

- [ ] EXTENSION deal: UI для выбора существующего Product
- [ ] При Won: создать Extension привязанный к выбранному Product
- [ ] API: поле existingProductId на Deal

### F.3 — Stage Gate Required Fields

- [ ] Обязательные поля при переходе стадий Deal (зависят от DealType)
- [ ] PRODUCT deal: productCategory + productType обязательны при SEND_OFFER
- [ ] PM + Deadline обязательны при DEPOSIT_AND_CONTRACT
- [ ] Amount + PaymentType обязательны при SEND_OFFER

---

## Бэклог

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

### Фаза 5 — Миграция Bitrix

- [ ] Импорт данных из Bitrix24 (~2000 записей)
- [ ] Маппинг полей Bitrix → NBOS
- [ ] Параллельная работа обоих инструментов
- [ ] Переключение

## Открытые вопросы (для обсуждения по мере продвижения)

- [ ] Data migration: есть ли Orders с type=SUBSCRIPTION в текущей БД?
- [ ] Бонусы: правило 80/20 (продажник/ассистент) vs текущая модель по KPI — решить
- [ ] Remember Client Payments — новый подмодуль (не описан в коде)
- [ ] Deal assistant (второй продажник) — не реализован
