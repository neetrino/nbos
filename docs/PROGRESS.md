# Ход разработки NBOS Platform

**Проект.** NBOS Platform  
**Текущая фаза.** Подготовка (документация и архитектура)  
**Общий прогресс.** 5%

**Последнее обновление.** 2026-03-11

---

## Обзор по фазам

| Фаза | Статус | Прогресс |
|------|--------|----------|
| 0. Подготовка (документация, стек, архитектура) | 🔄 В работе | 90% |
| 1. MVP (CRM, Projects, Clients, Finance, Auth) | ⏳ Ожидает | 0% |
| 2. Core (Tasks, Support, Credentials, Drive, Expenses, Bonus) | ⏳ Ожидает | 0% |
| 3. Автоматизация (уведомления, авто-биллинг, авто-задачи) | ⏳ Ожидает | 0% |
| 4. Расширенное (Messenger, Calendar, Dashboards) | ⏳ Ожидает | 0% |
| 5. Миграция (Bitrix, параллельная работа, переключение) | ⏳ Ожидает | 0% |

---

## Выполнено

### Фаза 0. Подготовка
- [x] BRIEF.md — техзадание на русском
- [x] TECH_CARD.md — технологическая карта (стек, решения)
- [x] 01-ARCHITECTURE.md — техническая архитектура на русском
- [x] Размер проекта C (monorepo) зафиксирован в cursor rules
- [ ] Инициализация monorepo (pnpm, Turborepo, apps/web, apps/api, packages)
- [ ] Базовая настройка Next.js и NestJS
- [ ] Prisma schema (первая итерация по модели данных)
- [ ] CI/CD (GitHub Actions), .env.example

---

## В работе

### Документация и старт кода
- Утверждение TECH_CARD и 01-ARCHITECTURE
- Следующий шаг: создание репозитория (apps/web, apps/api, packages), настройка окружения

**Блокеры.** Нет

---

## Ближайшие задачи

### Приоритет 1 (после утверждения документов)
1. [ ] Инициализация monorepo (pnpm workspace, Turborepo)
2. [ ] apps/web: Next.js 16, Tailwind, shadcn/ui
3. [ ] apps/api: NestJS 11, Prisma, базовые Guards
4. [ ] packages: shared-types, shared-zod (или один shared)
5. [ ] База данных: Prisma schema по docs/Docs/01-Platform-Overview/03-Core-Entities-and-Data-Model.md
6. [ ] Auth: интеграция Clerk (web + api)

### Приоритет 2
7. [ ] CRM: модуль лидов и сделок (API + UI)
8. [ ] Projects Hub: список проектов, базовая карточка проекта
9. [ ] Clients: компании и контакты
10. [ ] Finance: инвойсы, подписки, платежи (базовый поток)

### Приоритет 3
11. [ ] RBAC: матрица доступов в NestJS
12. [ ] Real-time: Socket.io Gateway (заглушка для уведомлений)
13. [ ] Очереди: BullMQ + первые джобы (например, смена стадии инвойса)

---

## Блокеры

### Критические
- Нет

### Некритические
- Нет

---

## Заметки и решения

### 2026-03-11
- Обновлены версии стека: Next.js 15→16, Prisma 6→7, Node.js 22→24 LTS, TypeScript 5.x→5.9, Clerk→Core 3. Обновлены TECH_CARD.md, 01-ARCHITECTURE.md, PROGRESS.md.

### 2026-03-05
- Вся техническая документация в `docs/` переведена/создана на русском: BRIEF.md, TECH_CARD.md, 01-ARCHITECTURE.md, PROGRESS.md.
- Стек: Next.js 16 (Vercel) + NestJS 11 (Render), PostgreSQL 17 (Neon), Upstash Redis, BullMQ, Clerk Core 3, R2, Socket.io, Prisma 7.

---

## Полезные ссылки

- [Сводный документ по платформе](Docs/00-Technical-Architecture-Brief.md)
- [Модель данных](Docs/01-Platform-Overview/03-Core-Entities-and-Data-Model.md)
- [Автоматизации](Docs/06-Integrations/05-Automation-Scenarios.md)
- [Матрица доступов RBAC](Docs/04-Roles-and-Access/02-Access-Matrix.md)

---

**Следующее обновление.** После утверждения документов и старта кода
