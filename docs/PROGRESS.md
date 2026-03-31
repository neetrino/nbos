# Ход разработки NBOS Platform

**Проект.** NBOS Platform  
**Текущая фаза.** Фаза 4 — Расширенное  
**Общий прогресс.** 85%

**Последнее обновление.** 2026-03-31

**Документация:** единая система указателей — [NBOS/00-Documentation-Hub.md](./NBOS/00-Documentation-Hub.md); исходные материалы New-Description перенесены в [archive/New-Description/](./archive/New-Description/).

---

## Обзор по фазам

| Фаза                                                          | Статус     | Прогресс |
| ------------------------------------------------------------- | ---------- | -------- |
| 0. Подготовка (документация, стек, архитектура)               | ✅ Готово  | 100%     |
| 0.5. Инициализация (monorepo, настройка, scaffold)            | ✅ Готово  | 100%     |
| 1. MVP (CRM, Projects, Clients, Finance, Auth)                | ✅ Готово  | 100%     |
| 2. Core (Tasks, Support, Credentials, Drive, Expenses, Bonus) | ✅ Готово  | 100%     |
| 3. Автоматизация (уведомления, авто-биллинг, авто-задачи)     | ✅ Готово  | 100%     |
| 4. Расширенное (Messenger, Calendar, Dashboards)              | ✅ Готово  | 100%     |
| 5. Миграция (Bitrix, параллельная работа, переключение)       | ⏳ Ожидает | 0%       |

---

## Выполнено

### Фаза 0. Подготовка

- [x] BRIEF.md — техзадание
- [x] TECH_CARD.md — технологическая карта (80+ пунктов)
- [x] 01-ARCHITECTURE.md — техническая архитектура
- [x] DEVELOPMENT_PLAN.md — детальный план разработки по фазам
- [x] Размер проекта C (monorepo) зафиксирован в cursor rules
- [x] 59 файлов детальной бизнес-документации в docs/NBOS/

### Фаза 0.5. Инициализация

- [x] Monorepo scaffold: pnpm workspace, Turborepo, package.json
- [x] apps/web: Next.js 16.1.6, Tailwind CSS 4, App Router
- [x] apps/web: Дизайн-система (Modern + Minimal микс) — цвета, шрифты, CSS variables
- [x] apps/web: Базовый layout (Sidebar с 14 пунктами + Topbar + Main)
- [x] apps/web: Dashboard page (статистика, активность, быстрые действия)
- [x] apps/api: NestJS 11, Swagger, Health check endpoint
- [x] apps/api: Database module (Prisma 7 + pg adapter + tsx loader)
- [x] packages/database: Prisma 7 schema — 19 сущностей, 40+ enum, миграция применена
- [x] packages/shared: типы, константы, Zod-схемы
- [x] packages/tsconfig + eslint-config
- [x] Prettier + Tailwind plugin, .env.example, .gitignore

### Фаза 1. MVP (текущая)

#### 1.1 — Auth + RBAC ✅

- [x] Декораторы: @Roles, @CurrentUser, @Public
- [x] Guards: AuthGuard (Clerk verifyToken), RolesGuard (12 ролей)
- [x] GlobalExceptionFilter + TransformInterceptor
- [x] Employee service + module (upsertFromClerk)
- [x] Clerk интеграция (web): ClerkProvider, middleware, sign-in/sign-up
- [x] Clerk JWT верификация в AuthGuard (@clerk/backend verifyToken)
- [x] Husky + lint-staged + commitlint (Conventional Commits)
- [x] Vitest: 136 тестов, 92%+ coverage
- [x] ESLint flat config (root + web)

#### 1.2 — CRM (Leads + Deals) ✅

- [x] Leads CRUD API (7 стадий, фильтры, пагинация, поиск, статистика)
- [x] Deals CRUD API (12 стадий, фильтры, пагинация, статистика)
- [x] Lead → Deal конверсия (CRM-03 автоматизация)
- [x] Lead Pipeline UI — Kanban-доска с 7 колонками
- [x] Deal Pipeline UI — Kanban-доска с 12 колонками
- [x] Create Lead модальное окно
- [x] CRM layout с табами (Leads | Deals)

#### 1.3 — Projects Hub ✅

- [x] Project CRUD API (фильтры, пагинация, код-генерация P-YYYY-NNNN)
- [x] Projects List UI — Grid/List view, поиск, карточки
- [x] Статистика по типам

#### 1.4 — Clients ✅

- [x] Contact CRUD API (роли, фильтры, связи с companies/projects/leads/deals)
- [x] Company CRUD API (Legal/Individual/SoleProprietor, Tax/TaxFree, связь с contact)
- [x] Contacts table UI (имя, контакт, роль, компании, активность)
- [x] Companies cards UI (имя, тип, налоговый статус, проекты/счета)
- [x] Clients layout с табами (Contacts | Companies)

#### 1.5 — Finance ✅

- [x] Orders CRUD API (код-генерация ORD-YYYY-NNNN, статусы, связь с project/deal)
- [x] Invoices CRUD API (код-генерация INV-YYYY-NNNN, статусы, авто-paidDate)
- [x] Invoice statistics (по статусу + общий revenue)
- [x] Orders table UI (код, проект, тип, сумма, статус, invoices count)
- [x] Invoices table UI (код, компания, сумма, статус, дата)
- [x] Finance layout с табами (Orders | Invoices)

---

## API Routes (70+ endpoints)

| Модуль    | Endpoint                         | Методы           |
| --------- | -------------------------------- | ---------------- |
| Health    | /api/health                      | GET              |
| CRM Leads | /api/crm/leads                   | GET, POST        |
| CRM Leads | /api/crm/leads/stats             | GET              |
| CRM Leads | /api/crm/leads/:id               | GET, PUT, DELETE |
| CRM Leads | /api/crm/leads/:id/status        | PATCH            |
| CRM Leads | /api/crm/leads/:id/convert       | POST             |
| CRM Deals | /api/crm/deals                   | GET, POST        |
| CRM Deals | /api/crm/deals/stats             | GET              |
| CRM Deals | /api/crm/deals/:id               | GET, PUT, DELETE |
| CRM Deals | /api/crm/deals/:id/status        | PATCH            |
| Projects  | /api/projects                    | GET, POST        |
| Projects  | /api/projects/stats              | GET              |
| Projects  | /api/projects/:id                | GET, PUT, DELETE |
| Contacts  | /api/clients/contacts            | GET, POST        |
| Contacts  | /api/clients/contacts/:id        | GET, PUT, DELETE |
| Companies | /api/clients/companies           | GET, POST        |
| Companies | /api/clients/companies/:id       | GET, PUT, DELETE |
| Orders    | /api/finance/orders              | GET, POST        |
| Orders    | /api/finance/orders/:id          | GET, DELETE      |
| Orders    | /api/finance/orders/:id/status   | PATCH            |
| Invoices  | /api/finance/invoices            | GET, POST        |
| Invoices  | /api/finance/invoices/stats      | GET              |
| Invoices  | /api/finance/invoices/:id        | GET, DELETE      |
| Invoices  | /api/finance/invoices/:id/status | PATCH            |

---

## Frontend Pages (27 маршрутов)

| Маршрут                | Статус | Описание                          |
| ---------------------- | ------ | --------------------------------- |
| /dashboard             | ✅     | Обзорная страница с статистикой   |
| /crm                   | ✅     | Redirect → /crm/leads             |
| /crm/leads             | ✅     | Lead Pipeline Kanban (7 колонок)  |
| /crm/deals             | ✅     | Deal Pipeline Kanban (12 колонок) |
| /projects              | ✅     | Список проектов (Grid/List)       |
| /clients               | ✅     | Redirect → /clients/contacts      |
| /clients/contacts      | ✅     | Таблица контактов                 |
| /clients/companies     | ✅     | Карточки компаний                 |
| /finance               | ✅     | Redirect → /finance/invoices      |
| /finance/orders        | ✅     | Таблица заказов                   |
| /finance/invoices      | ✅     | Таблица счетов                    |
| /tasks                 | ✅     | Tasks Kanban (6 колонок)          |
| /support               | ✅     | Support Tickets (таблица + SLA)   |
| /expenses              | ✅     | Expenses Dashboard                |
| /bonus                 | ✅     | Bonus Board Kanban (8 колонок)    |
| /credentials           | ✅     | Credentials Vault (AES-256-GCM)   |
| /drive                 | ✅     | File Explorer (R2)                |
| /calendar              | ✅     | Monthly Calendar + Events         |
| /crm/dashboard         | ✅     | Sales/CRM Dashboard               |
| /finance/dashboard     | ✅     | Finance Dashboard                 |
| /finance/payments      | ✅     | Payments Table                    |
| /finance/subscriptions | ✅     | Subscriptions Table               |
| /messenger             | ✅     | Messenger (channels + DMs)        |
| /partners              | ✅     | Partners Cards                    |
| /settings              | ✅     | Settings (Profile/Company/etc)    |
| /sign-in               | ✅     | Clerk Sign In                     |
| /sign-up               | ✅     | Clerk Sign Up                     |

---

### Фаза 2. Core

#### 2.1 — Tasks ✅

- [x] Tasks CRUD API (code gen T-YYYY-NNNN, Kanban, фильтры, stats)
- [x] Tasks Kanban UI (6 колонок, поиск, priority badges)

#### 2.2 — Support ✅

- [x] Support Tickets CRUD API (code gen TKT-YYYY-NNNN, SLA auto-calc)
- [x] Support Tickets UI (таблица, SLA индикаторы, фильтры)

#### 2.3 — Products + Extensions ✅

- [x] Products CRUD API (stage gate validation: NEW→CREATING→DEV→QA→TRANSFER→DONE)
- [x] Extensions CRUD API (stage gate: NEW→IN_PROGRESS→REVIEW→DONE)

#### 2.4 — Finance (расширение) ✅

- [x] Payments CRUD API (auto invoice/order status sync)
- [x] Subscriptions CRUD API (code gen SUB-YYYY-NNNN, billing day)

#### 2.5 — Expenses + Bonus ✅

- [x] Expenses CRUD API (Planned/Unplanned, 9 категорий, stats)
- [x] Expenses UI (dashboard, summary, фильтры)
- [x] Bonus CRUD API (8 стадий Kanban, stats)
- [x] Bonus Board UI (Kanban, summary)

#### 2.6 — Seed данные ✅

- [x] 33 демо записи (employees, contacts, companies, projects, products, leads, deals, orders, invoices, tasks, tickets, expenses)

#### 2.7 — Credentials Vault ✅

- [x] AES-256-GCM шифрование (password, apiKey, envData)
- [x] 4 уровня доступа (SECRET, PROJECT_TEAM, DEPARTMENT, ALL)
- [x] Audit log на каждый view/create/update/delete
- [x] CRUD API + UI (таблица с раскрытием, фильтры, поиск)

#### 2.8 — Drive ✅

- [x] R2 (S3-compatible) файловое хранилище
- [x] Presigned upload/download URLs
- [x] Project folder structure (tree view)
- [x] File explorer UI (grid/list view, breadcrumbs)

#### 2.9 — Notification Engine ✅

- [x] In-memory MVP (Map<userId, Notification[]>)
- [x] CRUD: create, findByUser, markAsRead, markAllAsRead, getUnreadCount
- [x] NotificationDropdown компонент в Topbar

---

## Блокеры

- Нет активных блокеров

### Фаза 3. Автоматизация

#### 3.1 — Notification Engine ✅

- [x] In-app notifications (in-memory MVP)
- [x] API: create, list, mark read, unread count
- [x] NotificationDropdown UI component

#### 3.2 — Авто-биллинг ✅

- [x] Monthly billing: subscription → auto-invoice
- [x] Monthly expenses: planned expense templates → auto-creation
- [x] Duplicate prevention (per month)
- [x] Error collection without stopping

#### 3.3 — Audit System ✅

- [x] Reusable AuditService (log, findByEntity, findByUser)
- [x] API endpoints for audit trail queries

#### 3.4 — Авто-задачи ✅

- [x] Product → auto-generate tasks from template (6 product types)
- [x] WEB_APP: 8 задач, MOBILE_APP: 8, DESIGN: 5, ERP_MODULE: 8, INTEGRATION: 5, OTHER: 4

#### 3.5 — Scheduler ✅

- [x] External cron endpoints: /scheduler/billing, /scheduler/expenses, /scheduler/overdue-invoices
- [x] Overdue invoice auto-marking

---

### Фаза 4. Расширенное

#### 4.1 — Dashboards ✅

- [x] CEO Dashboard — 6 KPI, revenue trend, deal funnel, activity/deadlines/deals списки
- [x] Finance Dashboard — revenue/outstanding/overdue/MRR, charts, payments/invoices
- [x] Sales/CRM Dashboard — leads/conversion/deals/pipeline, sources, performers

#### 4.2 — Calendar ✅

- [x] Monthly grid calendar (Date API, Monday-first)
- [x] 4 типа событий: Meeting, Deadline, Billing, Personal
- [x] Day detail panel, prev/next navigation, Today button

---

#### 4.3 — Messenger ✅

- [x] In-memory messenger (channels + DMs)
- [x] 7 API endpoints (channels CRUD, messages, DMs)
- [x] Slack-like UI (channel sidebar, message area, compose)
- [x] Pre-seeded: 3 channels, 5 messages, 4 DM users

#### 4.4 — Partners ✅

- [x] Partners CRUD API (type, direction, defaultPercent, status)
- [x] Partners card grid UI (search, badges)

#### 4.5 — Finance полный набор ✅

- [x] Payments table UI (summary cards, method filter)
- [x] Subscriptions table UI (MRR, status badges, billing day)
- [x] Finance layout с 6 табами

#### 4.6 — Settings ✅

- [x] 4 таба: Profile, Company, Notifications, Security
- [x] Forms + toggles (visual MVP)

---

## Следующие шаги (Фаза 5)

1. **Миграция из Bitrix24** → импорт данных (~2000 записей)
2. **Маппинг полей** → Bitrix → NBOS
3. **Параллельная работа** → оба инструмента одновременно

---

## Принятый дизайн-стиль

**Modern + Minimal Mix:**

- Тёплый серый фон (#F5F5F0) + белые карточки
- Чёрный текст + золотистый акцент (#E5A84B)
- Скруглённые углы (0.75rem)
- Минималистичные компоненты без визуального шума
- Иконки: Lucide React
