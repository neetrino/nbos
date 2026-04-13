# NBOS Platform — План разработки

**Проект.** NBOS Platform  
**Размер.** C (monorepo)  
**Дата создания.** 2026-03-11  
**Статус.** в работе

---

## Обзор фаз

```
Фаза 0 ███████████████████░  90%   Подготовка (документация)
Фаза 0.5 ░░░░░░░░░░░░░░░░░░░░   0%   Инициализация (monorepo, настройка)
Фаза 1 ░░░░░░░░░░░░░░░░░░░░   0%   MVP (CRM, Projects, Clients, Finance, Auth)
Фаза 2 ░░░░░░░░░░░░░░░░░░░░   0%   Core (Tasks, Support, Credentials, Drive)
Фаза 3 ░░░░░░░░░░░░░░░░░░░░   0%   Автоматизация
Фаза 4 ░░░░░░░░░░░░░░░░░░░░   0%   Расширенное (Messenger, Calendar, Dashboards)
Фаза 5 ░░░░░░░░░░░░░░░░░░░░   0%   Миграция
```

---

## Фаза 0.5. Инициализация проекта (текущая)

> **Цель:** Создать рабочий monorepo с базовой инфраструктурой, запускаемый локально.

### Этап 0.5.1 — Monorepo scaffold

| # | Задача | Статус |
|---|--------|--------|
| 1 | Создать `package.json` (root workspace) | ⬜ |
| 2 | Настроить `pnpm-workspace.yaml` | ⬜ |
| 3 | Настроить `turbo.json` (Turborepo) | ⬜ |
| 4 | Создать общие конфиги: `tsconfig/`, `eslint-config/` | ⬜ |
| 5 | `.gitignore`, `.env.example`, `.editorconfig` | ⬜ |

### Этап 0.5.2 — Frontend (apps/web)

| # | Задача | Статус |
|---|--------|--------|
| 1 | Инициализировать Next.js 15 (App Router, Turbopack) | ⬜ |
| 2 | Настроить Tailwind CSS 4 | ⬜ |
| 3 | Установить и настроить shadcn/ui | ⬜ |
| 4 | Настроить дизайн-систему (Modern + Minimal микс) | ⬜ |
| 5 | Создать базовый layout: sidebar + topbar + main content | ⬜ |
| 6 | Установить TanStack Query, Zustand, React Hook Form, Zod | ⬜ |
| 7 | Настроить API-клиент (axios/fetch wrapper) | ⬜ |

### Этап 0.5.3 — Backend (apps/api)

| # | Задача | Статус |
|---|--------|--------|
| 1 | Инициализировать NestJS 11 | ⬜ |
| 2 | Структура модулей (пустые папки: auth, crm, projects, finance, tasks, support, credentials, messenger) | ⬜ |
| 3 | Базовые Guards, Interceptors, Filters (common/) | ⬜ |
| 4 | Настроить Swagger (OpenAPI) | ⬜ |
| 5 | Health check endpoint | ⬜ |
| 6 | Logger (Pino) | ⬜ |
| 7 | Dockerfile | ⬜ |

### Этап 0.5.4 — Shared packages

| # | Задача | Статус |
|---|--------|--------|
| 1 | `packages/database` — Prisma schema (19 сущностей, первая итерация) | ⬜ |
| 2 | `packages/shared` — типы, enums, Zod-схемы, константы | ⬜ |
| 3 | `packages/eslint-config` — общие правила | ⬜ |
| 4 | `packages/tsconfig` — базовые tsconfig | ⬜ |

### Этап 0.5.5 — Quality & CI

| # | Задача | Статус |
|---|--------|--------|
| 1 | Prettier config | ⬜ |
| 2 | ESLint config (flat config) | ⬜ |
| 3 | Husky + lint-staged | ⬜ |
| 4 | Commitlint (Conventional Commits) | ⬜ |
| 5 | Vitest (базовый) | ⬜ |
| 6 | GitHub Actions CI workflow | ⬜ |

### Результат фазы 0.5

- `pnpm dev` запускает web (localhost:3000) и api (localhost:4000)
- Базовый layout с sidebar (14 пунктов, заглушки)
- API отвечает на health check
- Prisma schema с 19 сущностями
- Линтеры, форматтеры, хуки работают

---

## Фаза 1. MVP (2–3 месяца)

> **Цель:** Рабочая система с Auth, CRM, Projects, Clients, Finance.

### 1.1 — Auth + RBAC

| # | Задача | Описание |
|---|--------|----------|
| 1 | Интеграция Clerk (web) | Sign-in/up, middleware, providers |
| 2 | JWT верификация (api) | Guard для проверки Clerk JWT |
| 3 | Employee модель | Связка Clerk userId ↔ Employee |
| 4 | RBAC Guards | 12 ролей, 3 уровня доступа |
| 5 | Seed: тестовые пользователи | CEO, Seller, PM, Developer, Finance |

### 1.2 — CRM (Leads + Deals)

| # | Задача | Описание |
|---|--------|----------|
| 1 | Lead CRUD API | 7 стадий воронки, фильтры, поиск |
| 2 | Lead Pipeline UI | Kanban-доска, drag-and-drop |
| 3 | Deal CRUD API | 12 стадий, Stage Gates |
| 4 | Deal Pipeline UI | Kanban, карточка сделки |
| 5 | Lead → Deal конверсия | Автоматизация CRM-03 |
| 6 | Deal Won → Order + Project | Автоматизация CRM-04 |
| 7 | CRM Analytics (базовый) | Конверсия, воронка, источники |

### 1.3 — Projects Hub (базовый)

| # | Задача | Описание |
|---|--------|----------|
| 1 | Project CRUD API | Вычисляемый статус |
| 2 | Projects List UI | Grid/List view, фильтры |
| 3 | Project Card UI | 13 вкладок (заглушки), Overview полный |
| 4 | Product CRUD | 8 стадий, Stage Gates |
| 5 | Extension CRUD | Связь с Product и Order |

### 1.4 — Clients

| # | Задача | Описание |
|---|--------|----------|
| 1 | Company CRUD API + UI | Tax/Tax-Free логика |
| 2 | Contact CRUD API + UI | Связи, дедупликация |
| 3 | Client Portfolio | LTV, MRR, история |

### 1.5 — Finance (базовый)

| # | Задача | Описание |
|---|--------|----------|
| 1 | Order CRUD API | Типы оплат, связи |
| 2 | Invoice CRUD API + UI | Воронка (7 стадий) |
| 3 | Payment CRUD API + UI | Triggers: бонусы, статусы |
| 4 | Subscription CRUD API | Grid View: проекты × месяцы |
| 5 | Subscription Grid UI | Матрица с цветами |
| 6 | Payment Link (заглушка) | Страница оплаты для клиента |

---

## Фаза 2. Core (2–3 месяца)

### 2.1 — Tasks
- Kanban/Scrum доски, My Plan, List/Timeline views
- Множественные роли (Creator, Assignee, Co-Assignee, Observer)
- Шаблоны задач по типу продукта
- Чат в задачах

### 2.2 — Support
- ITIL-lite тикеты (4 категории, 3 приоритета)
- SLA (P1: 4ч, P2: 8ч, P3: 24ч)
- Change Request → Extension Deal

### 2.3 — Credentials Vault
- AES-256-GCM шифрование
- 4 уровня доступа
- Audit log на каждый view/edit
- Encrypted backup/export

### 2.4 — Drive
- Файлы по проектам (auto-структура)
- Quick Attach из R2
- Библиотека компании

### 2.5 — Expenses + Bonus Board
- Planned/Unplanned расходы
- Partner Payout (30%)
- Bonus Board (Kanban: Incoming | Active | Paid)
- Salary Board

---

## Фаза 3. Автоматизация (1–2 месяца)

### 3.1 — Notification Engine
- Event-driven архитектура
- In-App уведомления (real-time)
- Email (Resend)

### 3.2 — Авто-биллинг
- Subscription billing day → auto-Invoice (INV-01)
- Invoice стадии по таймерам (INV-02..07)
- 1-е число: planned expenses (EXP-01)

### 3.3 — Авто-задачи
- Product создан → задачи из шаблона (PRJ-01)
- Pass-through оплачен → задача на покупку (EXP-05)

### 3.4 — BullMQ Workers
- Очереди для всех асинхронных задач
- Retry, dead letter queue
- Dashboard мониторинг очередей

---

## Фаза 4. Расширенное (2–3 месяца)

### 4.1 — Messenger
- Проектные чаты с топиками
- Личные сообщения
- Омниканал (WhatsApp, Telegram — фаза 4+)

### 4.2 — Calendar
- Meetings (conflict detection)
- Deadlines (auto-populated)
- Team Schedule
- Billing Calendar

### 4.3 — Dashboards
- CEO Dashboard, Sales, Delivery, Finance
- Support, Subscription/MRR, Personal
- Marketing Analytics

### 4.4 — Доп. интеграции
- WhatsApp Business API
- Telegram Bot API
- Госсистема инвойсов

---

## Фаза 5. Миграция (1–2 месяца)

- Импорт данных из Bitrix24 (~2000 записей)
- Маппинг полей
- Параллельная работа
- Переключение

---

## Дизайн-система (Modern + Minimal)

> Микс двух концептов: чистая минимальная структура Classic + тёплые акценты и округлые формы Modern.

### Цветовая палитра

| Переменная | Значение | Описание |
|-----------|----------|----------|
| `--bg-primary` | `#F5F5F0` | Основной фон (тёплый серый, из Modern) |
| `--bg-card` | `#FFFFFF` | Фон карточек |
| `--bg-sidebar` | `#FAFAF7` | Фон сайдбара |
| `--text-primary` | `#1A1A1A` | Основной текст (чёрный, из Classic) |
| `--text-secondary` | `#6B6B6B` | Вторичный текст |
| `--accent-primary` | `#E5A84B` | Основной акцент (золото/янтарь из Modern) |
| `--accent-secondary` | `#1A1A1A` | Вторичный акцент (чёрный из Classic) |
| `--accent-muted` | `#F5DEB3` | Мягкий акцент |
| `--border` | `#E8E8E3` | Границы |
| `--success` | `#4CAF50` | Успех |
| `--warning` | `#E5A84B` | Предупреждение |
| `--error` | `#E53935` | Ошибка |

### Типографика

- **Заголовки:** Inter (600, 700)
- **Тело:** Inter (400, 500)
- **Моно:** JetBrains Mono (credentials, код)

### Компоненты

- **Карточки:** `border-radius: 16px`, тень `shadow-sm`, белый фон
- **Кнопки:** `border-radius: 10px`, основные — чёрные (Classic), акцентные — золотые (Modern)
- **Sidebar:** фиксированный, иконки + текст, RBAC-фильтрация
- **Таблицы:** чистые, минимальные borders (Classic стиль)
- **Charts:** тёплая палитра (gold, black, grey) как в Modern
- **Badges:** округлые, мягкие цвета

---

## Приоритеты и зависимости

```
Фаза 0.5 (Инициализация)
    │
    ├── Auth (1.1) ─────────┐
    │                       │
    ├── CRM (1.2) ──────────┼── Projects (1.3) ── Clients (1.4)
    │                       │
    └── Finance (1.5) ──────┘
                            │
                   Фаза 2 (Core)
                            │
                   Фаза 3 (Автоматизация)
                            │
                   Фаза 4 (Расширенное)
                            │
                   Фаза 5 (Миграция)
```

---

## Ключевые технические решения

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Monorepo tool | Turborepo | Быстрые параллельные сборки, кеширование |
| API format | REST + OpenAPI | Стандарт для mobile, Swagger auto-docs |
| Auth | Clerk | 2FA, быстрый старт, JWT, RN SDK |
| RBAC | Custom NestJS Guards | 12 ролей, 3 уровня, гибкость |
| State (client) | Zustand | Лёгкий, без бойлерплейта |
| State (server) | TanStack Query | Кеш, инвалидация, фоновое обновление |
| Forms | React Hook Form + Zod | Shared Zod schemas с backend |
| DB | PostgreSQL (Neon) + Prisma 7 | TypeSafe ORM, миграции, branches |
| Cache/Queue | Upstash Redis + BullMQ | Serverless Redis, надёжные очереди |
| Real-time | Socket.io (NestJS Gateway) | Встроенная поддержка в NestJS |
| Files | Cloudflare R2 | S3-compatible, бесплатный egress |
| Email | Resend | React Email шаблоны |
| Logging | Pino | Структурированные JSON логи |

---

**Следующий шаг:** Фаза 0.5.1 — Инициализация monorepo

