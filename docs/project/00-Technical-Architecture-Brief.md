# NBOS Platform — Technical Architecture Brief

> **Назначение этого документа:** передать полный контекст проекта для следующего этапа — проектирования технической архитектуры, выбора стека технологий, проектирования базы данных, API и инфраструктуры.
>
> **Как использовать:** в новом чате дать этот документ + при необходимости ссылаться на детальные документы из папки `Docs/`.

---

## 1. О компании и проекте

**Neetrino** — IT-компания (Армения), разрабатывающая веб-сайты, мобильные приложения, CRM-системы. ~20 сотрудников, ~20 активных проектов, ~100 клиентов на подписке (maintenance).

**NBOS Platform** — собственная Business Operation System, заменяющая Bitrix24. Это внутренний продукт (не SaaS), объединяющий CRM, управление проектами, финансы, задачи, поддержку, пароли, коммуникации и аналитику в одну систему.

**Главная идея:** Project — центральная сущность. Всё (заказы, задачи, инвойсы, пароли, файлы, чаты) привязано к проекту. Каждый специалист заходит в проект и видит то, что нужно именно ему.

---

## 2. Модель данных (19 сущностей)

### Иерархия:

```
Contact (человек)
  └── Company (юрлицо)
        └── Project (бизнес/бренд)
              ├── Product (website, app, CRM)
              │     ├── Order (коммерция: сумма, план оплаты)
              │     │     ├── Invoice (счёт)
              │     │     │     └── Payment (факт оплаты)
              │     │     └── Bonus Entry (бонус сотруднику)
              │     ├── Work Package / Sprint
              │     │     └── Task (задача)
              │     └── Support Ticket
              │
              ├── Extension (доработка к продукту)
              │     ├── Order → Invoice → Payment → Bonus
              │     └── Tasks
              │
              ├── Subscription Contract (ежемесячная подписка)
              │     └── Invoice (auto-generated monthly)
              │
              ├── Credential (пароль, зашифрованный)
              ├── Domain (доменное имя с датой истечения)
              ├── Asset / File (документы)
              ├── Chat (проектный чат с топиками)
              └── Audit Log
```

### Ключевые сущности и поля:

**Contact:** id, first_name, last_name, phone, email, messenger_links (JSON), role (Client/Partner/Contractor)

**Company:** id, name, type (Legal/Individual), tax_id, bank_details, tax_status (Tax/Tax-Free), contact_id

**Project:** id, name, contact_id, company_id, type (White Label/Mix/Custom Code), seller_id, pm_id, deadline, description. **Статус вычисляемый** — определяется статусами Products внутри.

**Product:** id, project_id, name, product_type (Website/App/CRM/Logo/Other), status (New/Creating/Development/QA/Transfer/On Hold/Done/Lost), order_id, pm_id, deadline, checklist_template_id

**Extension:** id, project_id, product_id (optional), name, size (Micro/Small/Medium/Large), status, order_id, assigned_to

**Order:** id, project_id, deal_id, type (Product/Extension/Subscription), payment_type (Classic 50-50/Classic 30-30-40/Subscription), total_amount, currency (AMD default), tax_status, status (Active/Partially Paid/Fully Paid/Closed), partner_id, partner_percent (30%), seller_bonus_percent (5-10%), delivery_bonus_percent (WL 7%/Mix 10%/CC 15%), seller_bonus_source (Cold Call/Marketing/Existing Client/Partner)

**Invoice:** id, order_id, subscription_id, project_id, company_id, amount, tax_status (inherited), type (Development/Extension/Subscription/Domain/Service), status (New/Created in Gov/Sent/Overdue/On Hold/Paid/Unpaid), due_date, paid_date, gov_invoice_id

**Payment:** id, invoice_id, amount, payment_date, confirmed_by (employee_id). **Payment triggers:** bonus creation, order status update, partner payout creation.

**Subscription:** id, project_id, type (Maintenance Only/Dev+Maintenance/Dev Only/Partner Service), amount, billing_day (1-28), tax_status, start_date, end_date, status (Active/Paused/Cancelled), partner_id

**Expense:** id, type (Planned/Unplanned), category (Domain/Hosting/Service/Marketing/Salary/Bonus/Partner Payout/Tools/Other), name, amount, frequency (One-time/Monthly/Quarterly/Yearly/Multi-year), due_date, status (This Month/Pay Now/Delayed/On Hold/Paid/Unpaid), project_id (optional), is_pass_through, tax_status

**Bonus Entry:** id, employee_id, order_id, project_id, type (Sales/Delivery/PM/Design/Marketing), amount, percent, status (Incoming/Earned/Pending Eligibility/Vested/Holdback/Active/Paid/Clawback), kpi_gate_passed, holdback_percent (20%), holdback_release_date, payout_month

**Lead:** id, contact_name, phone, email, source (Instagram/Facebook/Website/Cold Call/Partner/Referral), status (New/Didn't Get Through/Contact Established/MQL/SPAM/Frozen/SQL)

**Deal:** id, lead_id, project_id (for extensions), contact_id, type (New Client/Extension/Upsell), status (Start Conversation/Discuss Needs/Meeting/Can We Do It/Send Offer/Get Answer/Deposit & Contract/Creating/Get Final Pay/Maintenance Offer/Failed/Won), amount, payment_type, seller_id, source

**Support Ticket:** id, project_id, product_id, contact_id, category (Incident/Service Request/Change Request/Problem), priority (P1/P2/P3), status (New/Triaged/Assigned/In Progress/Resolved/Closed/Reopened), billable, assigned_to, sla_response_deadline, sla_resolve_deadline

**Credential:** id, project_id (optional), category (Admin/Domain/Hosting/Service/App/Mail/API Key/Database), provider, name, url, login (encrypted), password (encrypted), api_key (encrypted), env_data (encrypted), access_level (Secret/Project Team/Department/All), allowed_employees[]

**Domain:** id, project_id, domain_name, provider, account_id (→Credential), purchase_date, expiry_date, renewal_cost, client_charge, auto_renew, status

**Employee:** id, first_name, last_name, role (CEO/Seller/PM/Developer/Designer/QA/Tech Specialist/Finance/Marketing/Junior/Ops), department, level (Junior/Middle/Senior/Lead/Head), base_salary, work_schedule (JSON), status (Active/Probation/On Leave/Fired)

**Partner:** id, name, type (Regular/Premium), direction (Inbound/Outbound/Both), default_percent (30%), status

**Task:** id, title, project_id, product_id, extension_id, creator_id, assignee_id, co_assignees[], observers[], status (Backlog/To Do/In Progress/Review/Done/Cancelled), priority (Critical/High/Normal/Low), sprint_id, due_date, has_chat

---

## 3. Ключевые связи между сущностями

```
Lead ──1:1──► Deal ──1:1──► Order ──1:N──► Invoice ──1:1──► Payment
                                     │
                                     ├──1:N──► Bonus Entry
                                     └──1:1──► Partner Payout (Expense)

Contact ──1:N──► Project ──1:N──► Product ──1:1──► Order
                    │                │
                    │                └──1:N──► Task
                    ├──1:N──► Extension ──1:1──► Order
                    ├──1:N──► Subscription ──1:N──► Invoice
                    ├──1:N──► Credential
                    ├──1:N──► Domain
                    ├──1:N──► Asset
                    ├──1:N──► Chat
                    └──1:N──► Audit Log

Employee ──1:N──► Task (assignee)
Employee ──1:N──► Bonus Entry
Employee ──N:M──► Project (roles)
Employee ──N:M──► Credential (access)
```

**Правила целостности:**
- Каждый Invoice привязан к Order ИЛИ Subscription (обязательно)
- Каждый Bonus Entry привязан к Order (обязательно)
- Payment triggers: смена статуса Order, создание Bonus Entry, создание Partner Payout (Expense)
- Tax/Tax-Free наследуется: Company/Order/Subscription → Invoice
- Credential поля login/password/api_key/env_data — шифрование AES-256
- Audit обязателен для: Credentials, Invoices, Payments, Bonuses, Access changes
- Project status — вычисляемый, не хранится

---

## 4. Список модулей платформы (14 модулей)

| # | Модуль | Ключевой функционал |
|---|--------|-------------------|
| 1 | **CRM** | Lead Pipeline (7 стадий), Deal Pipeline (12 стадий), Extension Deals |
| 2 | **Projects Hub** | Центральная сущность. Карточка проекта с 13 вкладками. Вычисляемые статусы. |
| 3 | **Clients** | Companies + Contacts + Client Portfolio |
| 4 | **Finance** | Invoices (автоматизированная воронка), Payments, Subscriptions (Grid View: проекты × месяцы), Expenses (planned + unplanned), Bonus Board, Salary Board, P&L Reports |
| 5 | **Tasks** | Kanban/Scrum, множественные виды (List, My Plan, Timeline), роли (Creator/Assignee/Co-Assignee/Observer), чат в задачах, шаблоны по типу продукта |
| 6 | **Support** | ITIL-lite тикеты (Incident/Request/Change/Problem), SLA (P1/P2/P3), Change Request → Extension Deal |
| 7 | **My Company** | Оргструктура (EOS), команда, RBAC, KPI/Scorecard, SOP |
| 8 | **Partners** | Двунаправленная модель: Inbound (30% партнёру) + Outbound (партнёр платит нам) |
| 9 | **Messenger** | 3 области: клиентский омниканал (WhatsApp/Instagram/FB), проектные чаты с топиками, личные сообщения. Создание задач из чата. |
| 10 | **Calendar** | Встречи (conflict detection), дедлайны (auto-populated), расписание команды, биллинг-календарь |
| 11 | **Drive** | Файлы проектов (auto-структура), библиотека компании, Quick Attach |
| 12 | **Credentials** | Встроенный password vault. AES-256 шифрование. 5 уровней доступа. Audit log на каждый view/edit. Encrypted backup/export. |
| 13 | **Notifications** | Cross-module engine. Каналы: In-App, WhatsApp (клиенты), Telegram (команда), Email. Событийная модель. |
| 14 | **Dashboards** | 8 дашбордов: CEO, Sales, Marketing, Delivery, Finance, Support, Subscription/MRR, Personal |

---

## 5. Автоматизации (ключевые, всего 32+)

### Billing:
- Subscription billing day → auto-create Invoice
- Invoice stages auto-transition по таймерам (New → Create in Gov → Send → Overdue)
- 1-го числа каждого месяца → auto-create Expense cards из Planned Expenses
- Order fully paid → auto-create Partner Payout expense (30%)
- Subscription payment received → auto-create monthly Partner Payout

### Notifications (WhatsApp to clients):
- Invoice created → "Ваш счёт готов"
- Due date approaching → "Напоминание об оплате"
- Overdue → "Просрочка" (до 3 эскалаций)
- Domain renewal → "Срок домена истекает"

### Tasks:
- New Product created → auto-generate tasks from template
- Pass-through invoice paid → auto-create task "Купить домен/сервис"
- Required fields not filled → auto-create task for responsible person

### Bonuses:
- Invoice Paid (seller conditions met) → auto-create Seller Bonus
- Work Done + Invoice Paid → auto-create Delivery Bonus
- KPI gate check end of month → update bonus statuses
- Holdback release (30 days after delivery) → move to Active

### Projects:
- Product stage change → recalculate Project computed status
- All Products closed → suggest archival

---

## 6. Ключевые технические требования

### Безопасность:
- **Шифрование полей:** AES-256 для credential fields (login, password, api_key, env_data)
- **RBAC:** 3 уровня — модуль, проект, запись. 12 ролей с разными доступами.
- **Audit Logs:** все изменения критических данных (финансы, пароли, статусы, доступы)
- **Credential Backup:** encrypted export (ZIP/JSON), password-protected, для admin/owner
- **AI Data Policy:** Forbidden (пароли), Masked (финансы), Allowed (статусы, FAQ)

### Real-time:
- Чаты (проектные, задачные, личные) — real-time messaging
- Notifications — real-time push (in-app, optionally Telegram)
- Dashboard метрики — live data (не кэшированные)

### Автоматизация:
- Событийная архитектура: Payment → triggers (bonus, partner payout, order status)
- Scheduled jobs: billing (по расписанию подписок), planned expenses (1-го числа), SLA timers
- Автоматические стадийные переходы Invoice с таймерами

### Stage Gates:
- Validation engine: при переходе стадий проверяет обязательные поля, задачи, чеклисты
- Блокирует переход если условия не выполнены
- Конфигурируется per product type

### Поиск:
- Global search по всем сущностям (контакты, проекты, задачи, инвойсы, пароли по имени)
- Фильтрация во всех списках и досках

### Мультивалютность:
- Основная валюта: AMD
- Поддержка USD, EUR (для отдельных заказов)

### Масштаб данных:
- ~2000 существующих записей (миграция из Bitrix)
- Рост: 20 → 50+ проектов, 100 → 300+ подписок
- ~20 → 50+ пользователей
- Это НЕ high-load система, но должна быть responsive

---

## 7. Интеграции

| Интеграция | Приоритет | Назначение |
|-----------|-----------|-----------|
| WhatsApp Business API | High (Phase 1) | Уведомления клиентам об оплате, напоминания |
| Telegram Bot API | High (Phase 1) | Уведомления команде (задачи, дедлайны, SLA) |
| Government Invoice System | High (Phase 1) | Создание налоговых счетов (manual → auto в будущем) |
| Instagram / Facebook (Meta API) | Medium (Phase 2) | Входящие лиды и сообщения клиентов |
| Google Drive | Medium (Phase 3) | Синхронизация файлов проектов |
| GitHub | Low (Phase 3) | Привязка репозиториев к проектам |
| Bank API | Low (Phase 3) | Автоматическая проверка поступлений |
| Google Calendar | Low (Phase 4) | Синхронизация встреч |

---

## 8. Пользовательские роли и доступ

| Роль | Основные модули | Количество |
|------|----------------|-----------|
| CEO / Founder | Всё | 1-2 |
| Seller | CRM, Projects (частично), Finance (частично) | 2-3 |
| PM | Projects, Tasks, Messenger, Calendar, Support | 3-5 |
| Developer | Tasks, Credentials (project), Chat | 5-8 |
| Junior Developer | Tasks (только свои), Credentials (minimal) | 2-4 |
| Designer | Tasks, Drive | 1-2 |
| QA | Tasks, Support | 1-2 |
| Finance Director | Finance (всё), Invoices, Expenses, Subscriptions, Bonus | 1 |
| Marketing | CRM (Leads), Dashboards | 1-2 |
| Tech Specialist / Ops | Credentials, Domains, Drive | 1-2 |

---

## 9. UI/UX требования

- **Navigation:** Sidebar с 14 разделами, top bar (search, notifications, quick actions)
- **Views:** Kanban boards (drag-and-drop), List views (sortable tables), Grid views (matrix: rows × columns), Timeline/Gantt
- **Project Card:** 13 вкладок внутри проекта (Overview, Products, Extensions, Orders, Finance, Subscription, Tasks, Support, Credentials, Drive, Domains, Chat, Audit)
- **Subscription Grid View:** матрица проекты × 12 месяцев, цветовая кодировка оплат
- **Bonus Board:** Kanban — Incoming | Active | Paid
- **Task Detail:** split view — информация слева, чат справа
- **Responsive:** веб в первую очередь, мобильная адаптивность
- **Язык интерфейса:** English (основной)

---

## 10. Фазы реализации

| Фаза | Срок | Что входит |
|------|------|-----------|
| **Phase 1: MVP** | 2-3 мес | CRM (Leads + Deals), Projects Hub (basic), Clients, Finance (Invoices + Subscriptions), RBAC, Auth |
| **Phase 2: Core** | 2-3 мес | Tasks (Kanban/Scrum), Support (tickets), Credentials Vault, Drive, Expenses, Bonus Board |
| **Phase 3: Automation** | 1-2 мес | WhatsApp/Telegram notifications, Auto-billing, Auto-tasks, Notification engine |
| **Phase 4: Advanced** | 2-3 мес | Messenger (project chats + omnichannel), Calendar, Dashboards/Analytics, Templates/Checklists |
| **Phase 5: Migration** | 1-2 мес | Bitrix data import, parallel operation, cutover |

---

## 11. Полный список документации (59 файлов)

Все детальные документы находятся в папке `Docs/`:

### 01-Platform-Overview/
- `01-Vision-and-Goals.md` — Видение, цели, принципы, целевые пользователи
- `02-Platform-Architecture-Layers.md` — 5 слоёв архитектуры (Core → Control)
- `03-Core-Entities-and-Data-Model.md` — Все 19 сущностей с полями и связями

### 02-Modules/01-CRM/
- `01-CRM-Overview.md` — Обзор модуля CRM
- `02-Lead-Pipeline.md` — Воронка лидов (7 стадий, поля, автоматизации)
- `03-Deal-Pipeline.md` — Воронка сделок (12 стадий, Stage Gates, типы оплат)
- `04-Offers-and-Handoff.md` — Коммерческие предложения, Kickoff Checklist (15 пунктов)

### 02-Modules/02-Projects-Hub/
- `01-Project-Hub-Overview.md` — Центральный модуль, вычисляемые статусы
- `02-Project-Card.md` — 13 вкладок карточки проекта (детально)
- `03-Products-and-Extensions.md` — Продукты (8 стадий + Stage Gates), Доработки
- `04-Project-Lifecycle.md` — Полный жизненный цикл (12 фаз от Lead до Archive)

### 02-Modules/03-Clients/
- `01-Companies.md` — Компании, Tax/Tax-Free логика
- `02-Contacts.md` — Контакты, связи, дедупликация
- `03-Client-Portfolio.md` — Портфель клиента, LTV, MRR

### 02-Modules/04-Finance/
- `01-Finance-Overview.md` — Обзор финансового модуля
- `02-Invoices-and-Payments.md` — Воронка инвойсов, автоматизация, Payment triggers
- `03-Subscriptions.md` — Подписки, Grid View, биллинг, churn
- `04-Expenses.md` — Planned/Unplanned/Pass-through расходы
- `05-Bonus-and-Payroll.md` — Bonus Board, Salary Board, Payroll cycle
- `06-PnL-Reports.md` — P&L на 3 уровнях (компания, проект, заказ)
- `07-Domains-Hosting-Licenses.md` — Домены, хостинг, сервисы, lifecycle

### 02-Modules/05-Tasks/
- `01-Task-System-Overview.md` — Система задач, роли, статусы, чат в задачах
- `02-Boards-and-Views.md` — Kanban, Scrum, List, My Plan, Timeline
- `03-Templates-and-Checklists.md` — Шаблоны по типам продуктов, Stage Gate чеклисты

### 02-Modules/06-Support/
- `01-Support-Overview.md` — ITIL-lite, категории, SLA, abuse handling
- `02-Ticket-Workflow.md` — Жизненный цикл тикета
- `02-Ticket-Lifecycle.md` — Детальные стадии тикета
- `03-Support-Workflow.md` — Рабочий процесс поддержки

### 02-Modules/07-My-Company/
- `01-Org-Structure.md` — EOS Accountability Chart, 8 департаментов
- `02-Team-Employees.md` — Профили сотрудников, onboarding/offboarding
- `03-RBAC-Permissions.md` — 3 уровня доступов, credential access levels
- `04-KPI-Scorecard.md` — 22 метрики Scorecard, KPI по ролям
- `05-SOP-Templates.md` — 12 must-have SOPs, template library

### 02-Modules/08-Partners/
- `01-Partners-Overview.md` — Двунаправленная модель, Inbound/Outbound, Payout states

### 02-Modules/09-Messenger/
- `01-Messenger-Overview.md` — 3 области коммуникаций, Telegram strategy, фазы

### 02-Modules/10-Calendar/
- `01-Calendar-Overview.md` — 4 вкладки: Meetings, Deadlines, Schedule, Billing

### 02-Modules/11-Drive/
- `01-Drive-Overview.md` — Файловое хранилище, auto-структура, Quick Attach

### 02-Modules/12-Credentials/
- `01-Credentials-Vault.md` — Password vault, шифрование, backup, audit

### 02-Modules/13-Notifications/
- `01-Notifications-System.md` — Event-driven уведомления, 6 категорий, 4 канала

### 02-Modules/14-Dashboards/
- `01-Dashboards-Analytics.md` — 8 дашбордов, метрики, drill-down, phased rollout

### 03-Business-Logic/
- `01-Lead-to-Cash-Process.md` — Полный процесс от лида до денег
- `02-Order-to-Delivery-Process.md` — От заказа до сдачи проекта
- `03-Bonus-Payroll-Logic.md` — Бонусная система: формулы, KPI gates, holdback
- `04-Subscription-Billing-Logic.md` — Биллинг подписок, автоматизация
- `05-Change-Control-Process.md` — Управление изменениями, billable vs free
- `06-Entity-Relationships.md` — Карта связей, trigger chains

### 04-Roles-and-Access/
- `01-Role-Definitions.md` — 12 ролей: цели, KPI, доступы
- `02-Access-Matrix.md` — RBAC матрица (27 модулей × 12 ролей)

### 05-UI-Specifications/
- `01-Navigation-Structure.md` — Sidebar, Top Bar, Breadcrumbs, RBAC visibility
- `02-CRM-Pages.md` — Lead List, Deal Pipeline, Deal Card, Sales Analytics
- `03-Project-Hub-Pages.md` — Projects List, Project Detail (13 tabs)
- `04-Finance-Pages.md` — Invoices, Subscription Grid, Expenses, Bonus, Salary, P&L
- `05-Task-and-Support-Pages.md` — My Plan, Task Detail, Task Board, Tickets

### 06-Integrations/
- `01-WhatsApp-Integration.md` — Client notifications, message templates
- `02-Telegram-Integration.md` — Team notifications, 3 approaches
- `03-Bank-Integration.md` — Payment verification, matching logic
- `04-External-Services.md` — Google Drive, GitHub, Gov System, Meta API
- `05-Automation-Scenarios.md` — Полный реестр 32+ автоматизаций

### 07-Migration/
- `01-Bitrix-Migration-Plan.md` — 5 фаз миграции, маппинг данных, риски

---

## 12. Открытые технические вопросы для нового чата

Эти вопросы нужно решить на этапе технической архитектуры:

### Стек технологий:
1. Frontend framework: Next.js / React + Vite / другое?
2. Backend: Node.js (Express/Fastify/NestJS) / Go / Python (FastAPI)?
3. Database: PostgreSQL / MySQL? Нужен ли отдельный document store?
4. ORM: Prisma / Drizzle / TypeORM / raw SQL?
5. Real-time: WebSocket (Socket.io) / Server-Sent Events / другое?
6. Caching: Redis (нужен ли вообще при таком масштабе)?
7. File storage: S3-compatible / local / Google Drive integration?
8. Search: PostgreSQL full-text / Elasticsearch / Meilisearch?

### Архитектура:
9. Монолит или микросервисы? (для 20-50 пользователей скорее монолит)
10. API design: REST / GraphQL / tRPC?
11. Event system: простая очередь событий или полноценный message broker (RabbitMQ/Redis Streams)?
12. Background jobs: cron + queue system / node-cron / Bull/BullMQ?

### Инфраструктура:
13. Hosting: VPS (DigitalOcean/Hetzner) / Cloud (AWS/GCP)? Self-hosted обязательно (пароли!).
14. CI/CD: GitHub Actions / другое?
15. Containerization: Docker + Docker Compose?
16. SSL/TLS, reverse proxy: Nginx / Caddy?
17. Backup strategy: database + credentials + files

### Безопасность:
18. Authentication: JWT / Session-based? OAuth (Google)?
19. Encryption at rest: field-level (credentials) + database-level?
20. Rate limiting, CORS, CSP headers
21. Credential encryption key management: где хранить master key?

### Мобильность:
22. Responsive web only? Или PWA? Или native mobile app позже?

---

## 13. Рекомендуемый промт для нового чата

```
Я создаю собственную Business Operation System (NBOS Platform) для IT-компании.
Полная документация по бизнес-логике, модулям и UI уже готова (59 файлов).

Сводный документ: @00-Technical-Architecture-Brief.md
Детальная модель данных: @Docs/01-Platform-Overview/03-Core-Entities-and-Data-Model.md
Автоматизации: @Docs/06-Integrations/05-Automation-Scenarios.md

Задача: спроектировать техническую архитектуру:
1. Выбор стека технологий (frontend, backend, database, infra)
2. Архитектура приложения (monolith vs micro, API design)
3. Schema базы данных (SQL migrations)
4. Event system и автоматизации
5. Безопасность (auth, encryption, RBAC implementation)
6. Инфраструктура (hosting, CI/CD, deployment)
7. План реализации по фазам

Задавай вопросы если нужно, потом предлагай решения.
```
