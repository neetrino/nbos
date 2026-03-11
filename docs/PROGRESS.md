# Ход разработки NBOS Platform

**Проект.** NBOS Platform  
**Текущая фаза.** Фаза 0.5 — Инициализация проекта  
**Общий прогресс.** 12%

**Последнее обновление.** 2026-03-11

---

## Обзор по фазам

| Фаза | Статус | Прогресс |
|------|--------|----------|
| 0. Подготовка (документация, стек, архитектура) | ✅ Готово | 100% |
| 0.5. Инициализация (monorepo, настройка, scaffold) | 🔄 В работе | 80% |
| 1. MVP (CRM, Projects, Clients, Finance, Auth) | ⏳ Ожидает | 0% |
| 2. Core (Tasks, Support, Credentials, Drive, Expenses, Bonus) | ⏳ Ожидает | 0% |
| 3. Автоматизация (уведомления, авто-биллинг, авто-задачи) | ⏳ Ожидает | 0% |
| 4. Расширенное (Messenger, Calendar, Dashboards) | ⏳ Ожидает | 0% |
| 5. Миграция (Bitrix, параллельная работа, переключение) | ⏳ Ожидает | 0% |

---

## Выполнено

### Фаза 0. Подготовка
- [x] BRIEF.md — техзадание
- [x] TECH_CARD.md — технологическая карта (80+ пунктов)
- [x] 01-ARCHITECTURE.md — техническая архитектура
- [x] DEVELOPMENT_PLAN.md — детальный план разработки по фазам
- [x] Размер проекта C (monorepo) зафиксирован в cursor rules
- [x] 59 файлов детальной бизнес-документации в docs/NBOS/

### Фаза 0.5. Инициализация (текущая)
- [x] Monorepo scaffold: pnpm workspace, Turborepo, package.json
- [x] apps/web: Next.js 16.1.6, Tailwind CSS 4, App Router
- [x] apps/web: Дизайн-система (Modern + Minimal микс) — цвета, шрифты, CSS variables
- [x] apps/web: Базовый layout (Sidebar с 14 пунктами + Topbar + Main)
- [x] apps/web: Dashboard page (статистика, активность, быстрые действия)
- [x] apps/web: Маршруты для всех 14 модулей (заглушки)
- [x] apps/api: NestJS 11, Swagger, Health check endpoint
- [x] apps/api: Database module (Prisma 7 + pg adapter)
- [x] packages/database: Prisma 7 schema — 19 сущностей, 40+ enum, миграция SQL
- [x] packages/shared: типы, константы, Zod-схемы (Lead, Deal, Pagination)
- [x] packages/tsconfig: base, nextjs, nestjs конфиги
- [x] packages/eslint-config: базовые правила
- [x] .env.example обновлён
- [x] .gitignore обновлён
- [x] Prettier + Tailwind plugin
- [x] Next.js build — проходит ✅
- [x] NestJS build — проходит ✅
- [ ] Применить миграцию к БД (Neon недоступен — нужно разморозить)
- [ ] Husky + lint-staged + commit hooks
- [ ] GitHub Actions CI workflow

---

## В работе

### Фаза 0.5 — Остаток
- Husky и Git hooks
- CI workflow
- Применить миграцию к Neon когда БД станет доступной

**Блокеры:**
- Neon PostgreSQL временно недоступен (заморожен). Миграция SQL готова, нужно только применить.

---

## Ближайшие задачи

### Приоритет 1 (Фаза 1 — MVP)
1. [ ] Auth: интеграция Clerk (web + api JWT верификация)
2. [ ] Employee модель: связка Clerk userId ↔ Employee
3. [ ] RBAC Guards: 12 ролей, 3 уровня
4. [ ] CRM Leads: API + Kanban UI
5. [ ] CRM Deals: API + Pipeline UI
6. [ ] Projects Hub: CRUD + Card с вкладками

### Приоритет 2
7. [ ] Clients: Companies + Contacts
8. [ ] Finance: Orders, Invoices, Payments
9. [ ] Subscriptions: Grid View (проекты × месяцы)

---

## Дизайн

**Стиль:** Modern + Minimal микс (на основе 2 дизайн-концептов)
- Фон: тёплый серый `#F5F5F0` (Modern)
- Акцент: золото/янтарь `#E5A84B` (Modern)
- Кнопки/текст: чёрный `#1A1A1A` (Classic)
- Карточки: белые, `border-radius: 16px`, мягкие тени
- Шрифт: Inter (основной), JetBrains Mono (код)
- Sidebar: фиксированный, с коллапсом, RBAC-фильтрация

---

## Заметки и решения

### 2026-03-11 (Фаза 0.5)
- Создан DEVELOPMENT_PLAN.md с детальным планом всех фаз
- Инициализирован monorepo: apps/web (Next.js 16), apps/api (NestJS 11), packages
- Prisma 7 требует driver adapter (@prisma/adapter-pg) и prisma.config.ts — адаптировано
- Prisma 7 output теперь в src/generated/prisma, не в node_modules
- Дизайн-система с CSS variables для light/dark тем, основана на 2 концептах

### 2026-03-11 (ранее)
- Обновлены версии стека: Next.js 16, Prisma 7, Node.js 24 LTS, TS 5.9, Clerk Core 3

### 2026-03-05
- Вся документация создана/переведена на русском
- Стек утверждён

---

## Структура проекта

```
nbos/
├── apps/
│   ├── web/                     # Next.js 16 (Vercel)
│   │   └── src/
│   │       ├── app/(app)/       # App Router с layout
│   │       ├── components/      # UI + Layout компоненты
│   │       ├── features/        # По модулям
│   │       ├── hooks/
│   │       └── lib/             # utils, api client
│   └── api/                     # NestJS 11 (Render)
│       └── src/
│           ├── modules/         # 10 бизнес-модулей
│           ├── common/          # Guards, Filters, Interceptors
│           ├── jobs/            # BullMQ workers
│           └── main.ts
├── packages/
│   ├── database/                # Prisma 7 (19 сущностей)
│   ├── shared/                  # Типы, Zod-схемы, константы
│   ├── eslint-config/
│   └── tsconfig/
├── docs/
│   ├── DEVELOPMENT_PLAN.md      # ← План разработки
│   ├── BRIEF.md
│   ├── TECH_CARD.md
│   ├── 01-ARCHITECTURE.md
│   ├── PROGRESS.md              # ← Этот файл
│   └── NBOS/                    # 59 детальных документов
└── turbo.json
```

---

## Полезные ссылки

- [Сводный документ по платформе](NBOS/00-Technical-Architecture-Brief.md)
- [Модель данных](NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md)
- [Автоматизации](NBOS/06-Integrations/05-Automation-Scenarios.md)
- [Матрица доступов RBAC](NBOS/04-Roles-and-Access/02-Access-Matrix.md)

---

**Следующее обновление.** После завершения Фазы 0.5 и начала Фазы 1 (Auth + CRM)
