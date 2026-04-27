# NBOS Platform — Техническая архитектура

> Внутренняя Business Operation System: CRM, проекты, финансы, задачи, поддержка, пароли, коммуникации, аналитика. Замена Bitrix24.

**Размер проекта.** C (большой)  
**Последнее обновление.** 2026-04-27

---

## Обзор

### Назначение

NBOS объединяет все операционные процессы IT-компании в одной системе: от лида до оплаты, от задачи до сдачи проекта, от подписки до бонусов. Центральная сущность — **Проект**; всё привязано к нему.

### Основные особенности

- Модульная платформа NBOS: CRM, Projects Hub, Finance, Tasks, Support, Clients, Partners, Drive, Credentials, Messenger, Notifications, Calendar, Dashboard, Reports и др.
- Product-centric модель: Project содержит Product / Extension и связывает продажи, финансы, delivery, поддержку и файлы.
- Автоматизации: billing, notifications, bonus/payroll, SLA, scheduler, task automation.
- RBAC: 12 ролей, 3 уровня доступа (модуль / проект / запись)
- Real-time: чаты, уведомления, обновления дашбордов
- Шифрование полей Credentials (AES-256-GCM)

### Пользователи

- **CEO / Founder** — полный доступ, дашборды, аудит
- **Seller** — CRM, свои сделки и проекты, бонусы
- **PM** — проекты, задачи, поддержка, мессенджер
- **Developer / Designer / QA** — задачи, credentials по проектам, чаты
- **Finance Director** — финансы полностью
- **Tech Ops** — credentials, домены, Drive

---

## Архитектура

### Диаграмма высокого уровня

```
┌─────────────────────────────────────────────────────────────────┐
│                         КЛИЕНТЫ                                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │ Next.js Web  │  │ React Native     │  │ Внешние (WhatsApp,  │ │
│  │ (Vercel)     │  │ (mobile, позже)  │  │ Telegram, Gov API)  │ │
│  └──────┬───────┘  └────────┬─────────┘  └──────────┬───────────┘ │
│         │                   │                       │             │
│         │    REST + JWT     │      Webhooks /       │             │
│         │    OpenAPI       │      API              │             │
└─────────┼───────────────────┼───────────────────────┼─────────────┘
          │                   │                       │
          ▼                   ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS API (Render)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ REST API    │ │ WebSocket   │ │ BullMQ      │ │ Event      │ │
│  │ (Swagger)   │ │ (Socket.io) │ │ Workers     │ │ Emitter    │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ │
│         │               │               │               │        │
│         └───────────────┴───────────────┴───────────────┘        │
│                                 │                                 │
│                    Prisma + Guards + Interceptors                 │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ PostgreSQL 17   │    │ Upstash Redis   │    │ Cloudflare R2   │
│ (Neon)         │    │ (cache, queues, │    │ (файлы)         │
│                 │    │  pub/sub)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Архитектурный стиль

**Modular Monolith в формате monorepo.**

- Один backend-сервис (NestJS), разбитый на модули по доменам (CRM, Projects, Finance, Tasks и т.д.).
- Отдельное frontend-приложение (Next.js) и позже mobile (React Native).
- Общие пакеты: типы, Zod-схемы, Prisma-клиент, конфиги.

**Обоснование:** Масштаб 20–50 пользователей и 2–3 разработчика не требует микросервисов. Модульный монолит даёт чёткие границы модулей, единый деплой и простую отладку. Monorepo позволяет переиспользовать типы и контракты между web, api и mobile.

---

## Компоненты системы

### Frontend (apps/web)

- **Технологии:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, TanStack Query, Zustand, Framer Motion, @dnd-kit
- **Назначение:** UI для всех модулей, SSR где нужно, клиентский кеш и real-time подписки через WebSocket
- **Расположение:** `apps/web/`
- **Особенности:** 14 разделов в сайдбаре (RBAC скрывает недоступное), Kanban/List/Grid представления, глобальный поиск, центр уведомлений

### Backend (apps/api)

- **Технологии:** NestJS 11, Prisma 7, Socket.io (Gateway), BullMQ, class-validator, Zod
- **Назначение:** Бизнес-логика, валидация, RBAC, события, фоновые задачи, WebSocket
- **Расположение:** `apps/api/`
- **API:** REST, OpenAPI (Swagger) auto-generated. Backend JWT верифицируется в Guard.

### База данных

- **СУБД:** PostgreSQL 17 (Neon)
- **ORM:** Prisma 7
- **Схема:** основные сущности и связи описаны в `docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md`.
- **Миграции:** Prisma Migrate, SQL-миграции в репозитории

### Кеш и очереди

- **Redis:** Upstash (serverless). Используется для: сессий/кеша, очередей BullMQ, pub/sub для WebSocket при нескольких инстансах.
- **Очереди BullMQ:** биллинг подписок, переходы стадий инвойсов, создание бонусов, партнёрские выплаты, напоминания, SLA-таймеры, ежемесячные задачи (planned expenses, KPI-gate).

### Real-time

- **Socket.io** через NestJS WebSocket Gateway. Комнаты по проектам и задачам. События: новые сообщения в чате, смена статуса задачи, уведомления. При масштабировании api — Redis adapter для pub/sub.

---

## Структура проекта (monorepo)

```
nbos/
├── apps/
│   ├── web/                     # Next.js frontend (Vercel)
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router pages
│   │   │   ├── components/      # UI-компоненты
│   │   │   ├── features/        # по модулям: crm/, projects/, finance/, tasks/...
│   │   │   ├── hooks/           # кастомные хуки
│   │   │   └── lib/             # утилиты, API-клиент, конфиги
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                     # NestJS backend (Render)
│       ├── src/
│       │   ├── modules/         # бизнес-модули
│       │   │   ├── auth/
│       │   │   ├── crm/
│       │   │   ├── projects/
│       │   │   ├── finance/
│       │   │   ├── tasks/
│       │   │   ├── support/
│       │   │   ├── credentials/
│       │   │   ├── messenger/
│       │   │   └── ...
│       │   ├── common/          # guards, decorators, interceptors, filters
│       │   ├── jobs/            # BullMQ workers и cron-задачи
│       │   └── main.ts
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── database/                # Prisma schema + client + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   ├── shared/                  # общие TypeScript-типы, enums, Zod-схемы, константы
│   │   └── package.json
│   ├── eslint-config/           # общие правила линтера
│   └── tsconfig/                # общие tsconfig
│
├── docs/                        # документация
├── .env.example
├── .gitignore
├── package.json                 # root workspace
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Потоки данных

### Запрос пользователя (web)

1. Пользователь → Next.js (страница / Server Component или клиент).
2. Next.js → NestJS API (fetch/axios, JWT в заголовке).
3. API → Guard (JWT, RBAC) → Controller → DTO (валидация).
4. Controller → Service (бизнес-логика) → Prisma → БД.
5. Ответ по цепочке обратно; при необходимости — инвалидация TanStack Query и/или событие в WebSocket.

### Аутентификация

1. Вход через NextAuth.js v5 на frontend.
2. Frontend session использует NextAuth JWT; API-запросы получают backend JWT по принятому auth flow.
3. NestJS Guard проверяет backend JWT (`JWT_SECRET`), извлекает employee/user context → по нему загружается Employee и роли.
4. RBAC: второй Guard или декоратор проверяет доступ к модулю/проекту/записи по матрице ролей (см. `docs/NBOS/04-Roles-and-Access/02-Access-Matrix.md` и My Company / Settings canon).

### События и автоматизации

- **Синхронно:** NestJS `EventEmitter2`. Пример: `PaymentConfirmed` → обработчики обновляют Order, создают Bonus Entry, создают Partner Payout (Expense).
- **Асинхронно:** BullMQ. Пример: по расписанию (cron) — создание инвойсов по подпискам, смена стадий инвойсов, ежемесячные planned expenses, проверка SLA, разблокировка holdback по бонусам. Очереди позволяют повтор при сбоях и не блокируют API.

### Оплата клиентом (Payment Link)

1. Финдиректор или система создаёт Invoice → генерируется уникальная payment link.
2. Клиент получает ссылку (WhatsApp/Email) → переходит на страницу оплаты.
3. Страница оплаты показывает сумму, детали счёта и способы оплаты (банковская карта через IDBank/ARCA, Idram).
4. Клиент оплачивает → платёжный шлюз отправляет webhook на NestJS API.
5. API верифицирует webhook (подпись) → создаёт Payment → триггерит события (бонусы, статусы, партнёрские выплаты).

---

## База данных (кратко)

### Основные сущности

| Сущность           | Описание                                                     |
| ------------------ | ------------------------------------------------------------ |
| Contact            | Физлицо (клиент, партнёр)                                    |
| Company            | Юрлицо для биллинга                                          |
| Project            | Центральная сущность (бизнес/бренд клиента)                  |
| Product            | Продукт внутри проекта (сайт, приложение, CRM)               |
| Extension          | Доработка к продукту                                         |
| Order              | Заказ (сумма, тип оплаты, партнёр)                           |
| Invoice            | Счёт (привязка к Order или Subscription)                     |
| Payment            | Факт оплаты (триггеры: бонусы, статусы, партнёрские выплаты) |
| Subscription       | Подписка (ежемесячный биллинг)                               |
| Expense            | Расход (плановый/внеплановый, партнёрская выплата)           |
| Bonus Entry        | Запись бонуса сотруднику                                     |
| Lead / Deal        | Воронки CRM                                                  |
| Task               | Задача (проект, продукт, спринт, исполнители)                |
| Support Ticket     | Тикет поддержки (SLA, категории)                             |
| Credential         | Пароль/доступ (поля шифруются AES-256)                       |
| Domain             | Домен (срок, продление)                                      |
| Employee / Partner | Сотрудники и партнёры                                        |

### ER (связи)

Детальная модель и связи — в `docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md` и `docs/NBOS/03-Business-Logic/06-Entity-Relationships.md`.
Реализация схемы — в `prisma/schema.prisma` (или `packages/database`).

---

## Интеграции

| Сервис                    | Назначение                                 | Фаза |
| ------------------------- | ------------------------------------------ | ---- |
| NextAuth.js + own JWT     | Аутентификация, session, backend API token | 1    |
| IDBank (ARCA) + Idram     | Онлайн-оплата по ссылке (payment link)     | 1    |
| Resend                    | Email (инвойсы, уведомления)               | 1–3  |
| Cloudflare R2             | Файлы (Drive, вложения)                    | 2    |
| Upstash Redis             | Кеш, очереди, pub/sub                      | 1    |
| WhatsApp (агрегатор)      | Уведомления клиентам                       | 3    |
| Telegram Bot API          | Уведомления команде                        | 3    |
| Госсистема инвойсов       | Создание/синхронизация счетов              | 3    |
| Meta (Instagram/Facebook) | Лиды, сообщения                            | 4    |
| Google Drive / GitHub     | По мере необходимости                      | 4–5  |

---

## Безопасность

### Аутентификация

- **Метод:** NextAuth session на web + backend JWT для API, проверка на каждом запросе к API.
- **Хранение:** httpOnly cookie или заголовок Authorization (по решению frontend).
- **2FA:** обязательно для CEO, Finance Director, Tech Ops; конкретная реализация фиксируется отдельно при hardening auth.

### Авторизация (RBAC)

- **Модель:** RBAC по ролям (12 ролей) и контексту (модуль, проект, запись).
- **Реализация:** NestJS Guards + декораторы; матрица доступов — см. `docs/NBOS/04-Roles-and-Access/02-Access-Matrix.md`, `docs/NBOS/02-Modules/07-My-Company/03-RBAC-Permissions.md` и `docs/NBOS/02-Modules/16-Settings-Admin/02-Permissions-RBAC.md`.
- **Credentials:** отдельные уровни (Secret, Project Team, Department, All) и явный список сотрудников для Secret.

### Защита

- HTTPS везде.
- CORS только для доменов frontend (Vercel, кастомный домен).
- Rate limiting (ThrottlerModule).
- Валидация всех входных данных (Zod, class-validator).
- Поля Credential (login, password, api_key, env_data): шифрование AES-256-GCM, мастер-ключ в env, без выдачи расшифрованного в API без необходимости и с аудитом.

### Шифрование Credentials (key management)

- **Алгоритм:** AES-256-GCM (authenticated encryption).
- **Мастер-ключ:** `CREDENTIAL_ENCRYPTION_KEY` хранится в env (Render secrets). 32-байтный ключ, сгенерирован криптографически.
- **IV/Nonce:** уникальный для каждой записи, хранится вместе с ciphertext (формат: `iv:authTag:ciphertext`, base64).
- **Шифруемые поля:** `login`, `password`, `api_key`, `env_data` в таблице Credential.
- **Дешифрование:** только при явном запросе пользователя с правами доступа. Каждый view/edit записывается в Audit Log.
- **Ротация ключа:** при необходимости — скрипт перешифрует все записи новым ключом.
- **Бэкап:** encrypted export (ZIP/JSON) с дополнительным паролем, доступен только CEO.

---

## Деплой

### Окружения

| Окружение   | URL                                            | Назначение           |
| ----------- | ---------------------------------------------- | -------------------- |
| Development | localhost:3000 (web), localhost:4000 (api)     | Локальная разработка |
| Staging     | staging-\*.vercel.app, api на Render (staging) | Приёмка, тесты       |
| Production  | кастомный домен (nbos.\*)                      | Боевой режим         |

### Инфраструктура

- **Frontend:** Vercel (Next.js), автодеплой из main / веток.
- **Backend:** Render (Docker), WebSocket и фоновые workers в том же сервисе (или отдельный worker при росте).
- **БД:** Neon PostgreSQL (branch для staging при необходимости).
- **Redis:** Upstash.
- **Файлы:** Cloudflare R2.
- **CI/CD:** GitHub Actions (lint, test, build; деплой web на Vercel, api на Render).

---

## Масштабирование

### Текущие ориентиры

- Пользователи: 20 → 50+
- Проекты: 20 → 50+
- Подписки: ~100 → 300+
- Запросов/сек: умеренная нагрузка, не high-load

### План при росте

1. Увеличить лимиты соединений и таймауты БД при необходимости.
2. Вынести тяжёлые фоновые задачи в отдельный worker (Render worker или отдельный сервис).
3. При нескольких инстансах API — Redis adapter для Socket.io.
4. Поиск: при росте объёма данных рассмотреть Meilisearch поверх текущего PostgreSQL FTS.

---

## Ключевые решения

| Решение          | Выбор                 | Причина                                            |
| ---------------- | --------------------- | -------------------------------------------------- |
| Backend          | NestJS                | Модули, очереди, WebSocket, RBAC, Swagger          |
| API              | REST + OpenAPI        | Удобно для mobile и внешних интеграций             |
| Auth             | NextAuth.js + own JWT | Internal auth, invite-only access, backend API JWT |
| RBAC             | Свой в NestJS         | 12 ролей, 3 уровня, матрица из документации        |
| Платежи          | IDBank (ARCA) + Idram | Payment links, webhook для подтверждения           |
| Очереди          | BullMQ + Redis        | Надёжные фоновые задачи и отложенные задания       |
| Real-time        | Socket.io в NestJS    | Чаты и уведомления без внешнего сервиса            |
| Шифрование       | AES-256-GCM           | Поля Credential, мастер-ключ в env                 |
| Frontend хостинг | Vercel                | Оптимально для Next.js                             |
| Backend хостинг  | Render                | Docker, WebSocket, workers                         |

---

## Связанные документы

- [BRIEF.md](./BRIEF.md) — техзадание
- [TECH_CARD.md](./TECH_CARD.md) — технологическая карта
- [02-TECH_STACK.md](./02-TECH_STACK.md) — стек (при наличии)
- [04-API.md](./04-API.md) — описание API (при наличии)
- [05-DATABASE.md](./05-DATABASE.md) — схема БД (при наличии)
- [DECISIONS.md](./DECISIONS.md) — журнал решений
- [NBOS/00-Documentation-Hub.md](./NBOS/00-Documentation-Hub.md) — центральный указатель канона
- [NBOS/00-Implementation-Roadmap.md](./NBOS/00-Implementation-Roadmap.md) — порядок реализации
- [NBOS/00-Documentation-Consistency-Audit.md](./NBOS/00-Documentation-Consistency-Audit.md) — финальный аудит перед разработкой

---

**Версия документа.** 1.0  
**Дата.** 2026-04-27
