# NBOS Platform — Architecture Layers

## Обзор

Платформа строится как пятислойная архитектура. Каждый слой имеет свою ответственность и не смешивается с другими.

```
┌─────────────────────────────────────────────────┐
│              CONTROL LAYER                       │
│   Dashboards · KPI · Scorecard · Audit · P&L    │
├─────────────────────────────────────────────────┤
│            AUTOMATION LAYER                      │
│   Billing · Notifications · AI · Integrations   │
├─────────────────────────────────────────────────┤
│            EXECUTION LAYER                       │
│   Projects · Tasks · Orders · Tickets · Chat    │
├─────────────────────────────────────────────────┤
│           MANAGEMENT LAYER                       │
│   EOS Cadence · L10 · Rocks · SOP · Roles       │
├─────────────────────────────────────────────────┤
│              CORE LAYER                          │
│   V/TO · OKR · Pricing · Taxonomy · RBAC Rules  │
└─────────────────────────────────────────────────┘
```

---

## Cross-layer engineering rule: module independence

Каждый модуль NBOS должен продолжать работать, даже если связанный модуль ещё не реализован, временно недоступен или выключен feature flag.

Это называется `Module Independence / Graceful Degradation`.

Правило:

```text
Hard business dependency -> block only the specific unsafe transition.
Soft dependency missing -> show warning / empty state / link later.
Unavailable module -> do not crash the current module.
```

Примеры:

- Marketing Activity работает без Finance Expense link, но CPL/ROI показывают `No spend data`.
- Product page работает без Drive/Credentials/Messenger, но показывает empty/coming-later tabs.
- Dashboard открывается даже если один widget упал.
- Reports показывает data-quality warning, если source data неполные.
- CRM не падает из-за отсутствия Reports, но stage gates блокируют небезопасный переход.

Подробнее: [00-Implementation-Roadmap.md](../00-Implementation-Roadmap.md).

---

## Layer 1: Core Layer (Стратегия и правила)

**Назначение:** фундаментальные правила бизнеса, которые редко меняются.

### Что здесь живёт:

- **Vision/Traction Organizer (V/TO):** Core Focus, 10-year target, 3-year picture, 1-year plan
- **OKR-lite:** 3–5 годовых Objectives с измеримыми Key Results
- **Pricing Rules:** типы оплаты (Classic 50/50, Classic 30/30/40, Subscription), правила расчёта бонусов
- **Product Taxonomy:** типы проектов (White Label / Mix / Custom Code), типы продуктов (Website, App, CRM, Logo, SMM), типы заказов (Product, Extension, Subscription)
- **RBAC Rules:** матрица доступов по ролям (CEO, Seller, PM, Dev, Finance, Ops, Junior)
- **Bonus Rules:** формулы начисления, KPI-gates, holdback, cap, clawback
- **Partner Rules:** процент партнёра (30%), условия выплат, типы партнёров

### Кто управляет:

CEO / Founders. Изменения этого слоя — стратегические решения.

---

## Layer 2: Management Layer (Операционное управление)

**Назначение:** ритм управления компанией по EOS.

### Что здесь живёт:

- **EOS Cadence:**
  - L10 Weekly Meeting (60–90 мин)
  - Daily Sync (Delivery 10–15 мин, Support 10 мин)
  - Monthly Finance Review (P&L, cash-flow, дебиторка)
  - Quarterly Planning (Rocks, OKR review, capacity)
- **Scorecard:** 5–15 еженедельных метрик (Sales, Delivery, Support, Finance, Recurring)
- **Rocks:** 3–7 квартальных приоритетов компании + Rocks по отделам
- **Issues List + IDS:** Identify → Discuss → Solve для решения проблем
- **Roles & Owners:** Accountability Chart — кто за что отвечает головой
- **SOP Registry:** реестр стандартных процедур (kickoff, release, triage, handoff)

### Кто управляет:

CEO + Heads of Departments (Sales, Delivery, Support, Finance).

---

## Layer 3: Execution Layer (Ежедневная работа)

**Назначение:** здесь происходит реальная работа — проекты, задачи, продажи, поддержка.

### Модули этого слоя:

| Модуль           | Назначение                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| **CRM**          | Lead/Deal pipeline, Extension Deals, Offers                            |
| **Projects Hub** | Центральная сущность: проекты, продукты, заказы                        |
| **Tasks**        | Задачи: kanban/scrum, множественные виды, роли                         |
| **Finance**      | Invoices, Payments, Expenses, Subscriptions, Bonus Ledger              |
| **Support**      | Тикеты (Incident/Request/Change/Problem), SLA                          |
| **Clients**      | Companies, Contacts, Client Portfolio                                  |
| **Partners**     | Partner Directory, Referral Deals, Payouts                             |
| **Credentials**  | Password Vault, Access Control, Backup                                 |
| **Messenger**    | Project Chats, Task Chats, Client Omnichannel                          |
| **Calendar**     | Client Meetings, Product/Extension Delivery Deadlines, Personal Events |
| **Drive**        | Project Files, Company Library, Quick Attach                           |
| **My Company**   | Org Structure, Team, Permissions, KPI, SOP                             |

### Кто работает:

Все сотрудники компании, каждый в своих модулях согласно роли.

---

## Layer 4: Automation Layer (Автоматизация)

**Назначение:** убрать ручной труд и обеспечить своевременность операций.

### Автоматизации:

#### Billing & Finance

- Автоматическое создание инвойсов по подпискам (1-го числа или по индивидуальной дате)
- Автоматическая смена стадий инвойса по таймерам
- Автоматическое создание planned expenses каждый месяц
- Автоматическое создание затрат для партнёрских выплат

#### Notifications (WhatsApp / Telegram / In-App)

- Напоминание клиенту об оплате (создание → напоминание → просрочка → эскалация)
- Уведомление бухгалтеру о необходимости выставить счёт в госсистеме
- Уведомление финдиректору о просроченных затратах
- Уведомление о приближении дедлайна проекта
- Уведомление о продлении домена/хостинга (за 2 месяца)

#### Task Automation

- Автоматическое создание задач при определённых событиях (оплата домена → задача "создать аккаунт и купить домен")
- Автоматическое создание стандартных задач по шаблону продукта
- Автоматическое создание задач-напоминаний для финдиректора

#### AI Layer (Phase 3+)

- Auto-reply клиентам в нерабочие часы
- Message → Ticket/Task (из WhatsApp/Telegram создание тикета)
- Project Brief Summarizer (handoff seller → PM)
- AI triage (присвоение приоритета и категории обращению)
- AI data classification: Forbidden (пароли) / Masked (финансы) / Allowed (статусы, FAQ)

#### Integrations

- WhatsAppWebAdapter через WAHA / QR-connected WhatsApp account (группы, редкие 1:1, клиентские уведомления)
- Instagram / Facebook (входящие обращения)
- Telegram Bot API (внутренние чаты, уведомления)
- Bank API (проверка поступлений)
- Government Invoice System (создание и синхронизация счетов)
- Google Drive (файлы проектов)
- GitHub (репозитории проектов)

### Кто управляет:

CEO / Ops / Finance Director настраивают правила. Автоматизация работает без участия людей.

---

## Layer 5: Control Layer (Метрики, аналитика, аудит)

**Назначение:** видимость и контроль всего, что происходит в компании.

### Control surfaces:

| Surface                      | Для кого               | Назначение                                                            |
| ---------------------------- | ---------------------- | --------------------------------------------------------------------- |
| **Dashboard Control Center** | Каждый сотрудник       | Персональный пульт: pinned actions, priority feed, role widgets       |
| **Role / module dashboards** | Heads / teams          | Быстрые рабочие показатели внутри модуля без глубокого report-builder |
| **Reports / Analytics**      | CEO / Heads / Finance  | Кросс-модульные отчёты, saved views, exports, scheduled reports       |
| **Scorecard**                | CEO + Heads            | Еженедельные 5–15 метрик компании и отделов                           |
| **Audit**                    | CEO / Admin / Security | Контроль чувствительных изменений, доступов и финансовых действий     |

Examples of module dashboards:

- Sales pipeline dashboard;
- Delivery status dashboard;
- Finance working dashboard;
- Support SLA dashboard;
- Marketing dashboard;
- Subscription dashboard;
- Personal dashboard.

### Scorecard (Weekly):

5–15 ключевых метрик, обновляемых еженедельно:

- Marketing: Leads/week, MQL/week, CPL
- Sales: SQL/week, Close rate, Revenue/week
- Delivery: On-time %, Variance %, Bugs to prod
- Support: SLA %, First response, Tickets closed
- Finance: Cash balance, Overdue invoices, Gross margin %
- Recurring: MRR, Churn rate

### Audit:

- Все изменения финансовых данных (инвойсы, платежи, бонусы)
- Все просмотры и изменения паролей/credentials
- Изменения статусов проектов/заказов
- Изменения доступов и ролей
- AI-операции (что запрошено, что создано)

### Reports / Analytics:

- Company P&L (ежемесячно)
- Project P&L (по каждому проекту)
- Order P&L (по каждому заказу)
- Subscription MRR Report (помесячно)
- Expense Report (planned vs actual)
- Bonus & Payroll Report (ежемесячно)

### Кто использует:

CEO — всё. Heads — свои метрики. Finance — все финансовые отчёты. Каждый сотрудник — свой Personal Dashboard.

---

## Связь слоёв

```
Core Layer      →  задаёт правила для  →  Management Layer
Management Layer →  задаёт ритм для    →  Execution Layer
Execution Layer  →  генерирует данные   →  Control Layer
Automation Layer →  ускоряет работу     →  Execution Layer
Control Layer    →  даёт обратную связь →  Management Layer → Core Layer
```

Каждый слой зависит от нижестоящего и информирует вышестоящий. Это замкнутый цикл управления.
