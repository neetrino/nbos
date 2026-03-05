
([Past chat](https://chatgpt.com/c/695ce6b2-b390-832b-ae9a-a6bdc75eae15 "NEETRINO BUSINESS OPERATING SYSTEM (NBOS)"))([Past chat](https://chatgpt.com/c/695d008a-0374-832c-993a-ee557b03ab27 "Ветка Team v2 · NEETRINO BUSINESS OPERATING SYSTEM (NBOS)"))([Past chat](https://chatgpt.com/c/695cf70e-efec-8333-a2ef-a6d2dd0f9f11 "Ветка EOS + Agile + ITIL-lite + OKR-lite ·  NEETRINO BUSINESS OPERATING SYSTEM (NBOS)"))([Past chat](https://chatgpt.com/c/695cfe1a-1aa4-8325-ae96-67c20875eb15 "Ветка Team v1 · NEETRINO BUSINESS OPERATING SYSTEM (NBOS)"))

Сделал. И да, Bitrix тут не “плохой”. Он просто не нанимался быть **операционным мозгом** компании, где 20 проектов + 100 подписок + бонусная зарплата на событиях.

Ниже: **целевая модель NBOS для Neetrino** (Шаг 3–5), уже “приземлённая” под вашу реальность: _Project Hub + Orders + Work + Finance + Bonus + Support + Access_.

---

# Шаг 3 — Структура Business Operation System для Neetrino (NBOS v1)

## 0) Два слоя, чтобы не смешивать кислое с квадратным

1. **NBOS как Operating Model (как управляем компанией)**: EOS + OKR-lite + Agile Delivery + ITIL-lite. Это у вас уже правильно оформлено в документе.
    
2. **NBOS как Platform (софтовая система)**: ваша собственная замена Bitrix, где “Project” это центральный контейнер, а CRM/финансы/задачи/документы/поддержка это модули и представления.
    

Дальше я описываю **оба**, но главным фокусом делаю Platform, потому что это ваш главный “узкий горлышко”.

---

## 1) Organizational Structure (оргструктура)

### 1.1. L1 Accountability Chart (целевая оргось)

Минимальная структура, “чтобы работало и масштабировалось”, совпадает с вашим NBOS: Executive, Marketing, Sales, Delivery, Support, HR/Training, Finance/Legal, Ops/Admin.

### 1.2. Критическое разделение потоков

**Projects (Delivery) ≠ Maintenance (Support)** должно быть закреплено в процессах, людях, очередях работ и KPI.

### 1.3. Ролевые владельцы (Owners) по направлениям

(не “кто свободен”, а кто отвечает головой)

- **CEO / Executive**: прибыль, рост, система управления по KPI
    
- **Head of Sales**: конверсия в деньги, revenue/week, close rate
    
- **Head of Delivery**: on-time, variance, маржа проекта
    
- **Head of Support**: SLA, first response, удержание
    
- **Finance & Legal**: дебиторка/DSO, просрочки, отчётность вовремя
    
- **Ops/Admin**: домены/хостинги/доступы/аккаунты (у вас сейчас это на CEO/вас, но это надо вынести)
    

---

## 2) Process Architecture (архитектура процессов)

### 2.1. Сквозные процессы (end-to-end)

1. **Lead-to-Cash**  
    Lead → Deal → Offer → Contract → Invoice → Payment → Order → Project kickoff → Delivery → Close → Upsell → Subscription.
    
2. **Order-to-Delivery (Projects)**  
    Intake/Presale handoff → Planning → Execution → QA/Release → Close → handoff to Support
    
3. **Ticket-to-Resolution (Maintenance / ITIL-lite)**  
    Intake → Triage → Assign → Execute → Close → Problem/RCA (если повторяется)
    
4. **Renewal-to-Retention (Subscription)**  
    Monthly invoice generation → payment status → SLA/service tracking → renewal risk → retention actions.
    
5. **Procure-to-Pay (расходы)**  
    Planned recurring (domain/hosting/tools) + unplanned расходов → согласование → оплата → привязка к Project/Order → P&L.
    
6. **Bonus-to-Payroll (самое важное у вас)**  
    Earn event → eligibility/KPI gate → holdback → payout run → clawback (если refund/chargeback).
    

### 2.2. Must-have SOP (минимальный комплект на 2026)

Формат SOP и список must-have у вас уже правильно определены.  
В Platform это должно стать не “папкой”, а **встроенными чек-листами и статусами** (kickoff checklist, release checklist, ticket template).

---

## 3) Decision-Making Framework (как принимаются решения)

### 3.1. EOS контур управления

- **V/TO**: фокус, 1-year plan, quarterly rocks
    
- **Scorecard 5–15 метрик, еженедельно**
    
- **Rocks (90 дней)** + **IDS** для решения проблем
    
- **L10 weekly (60–90 мин)** как главный “операционный процессор”
    
- Ежемесячный финансовый обзор (P&L, cash-flow, дебиторка)
    

### 3.2. Правило Change Control (обязательно для вас)

Любой Change Request из поддержки/чата:

- либо **Ticket (non-billable)** если это “сломалось/наша вина”
    
- либо **Extension Order (billable)** если это новая работа/изменение.
    

И решение принимается не “в чате”, а через mini-IDS: проблема → варианты → решение → owner → срок.

---

## 4) AI Governance Layer (AI-слой без утечек и цирка)

Вы хотите AI для:

- ответов клиентам в нерабочие часы,
    
- превращения сообщений в задачи,
    
- суммаризации контекста.
    

### 4.1. Классификация данных (policy)

- **AI Forbidden**: пароли/секреты, ключи API, токены, реквизиты доступа (и любые “Credentials”).
    
- **AI Masked**: персональные данные, финансы в деталях, договоры (маскируем суммы/имена при необходимости).
    
- **AI Allowed**: тикеты, статусы, публичные техописания, FAQ, релиз-ноты, чек-листы.
    

### 4.2. Разрешённые AI-сценарии (MVP)

1. **Auto-reply / triage**: “приняли запрос, уточняющие вопросы, присвоили приоритет”.
    
2. **Message → Ticket/Task**: из WhatsApp/Telegram создаём тикет, ставим категорию Incident/Request/Change.
    
3. **Project Brief Summarizer**: краткая сводка проекта для handoff seller → PM.
    

### 4.3. Контроли (чтобы не было “AI видел пароль и запомнил”)

- Redaction: любые поля Credentials не попадают в контекст AI.
    
- Audit: кто запускал AI-операции, что создалось (лог действий).
    
- Human-in-the-loop: всё, что отправляется клиенту, либо шаблонно, либо требует подтверждения (на первых этапах).
    

---

## 5) Financial Control System (финконтроль)

### 5.1. Уровни учёта

- **Company level**: cash, P&L, payroll, marketing spend.
    
- **Project level**: P&L по проекту (доходы/расходы/маржа).
    
- **Order level**: экономика конкретной продажи (development/extension/subscription).
    

Ваш NBOS требует регулярный финобзор и контроль дебиторки.

### 5.2. Расходы (как вы описали, но “взросло”)

- **Planned recurring**: domain/hosting/tools/subscriptions (месяц/год).
    
- **Unplanned**: маркетинг “внезапно”, новые сервисы, разовые закупки.
    
- Каждый расход обязательно имеет:
    
    - category
        
    - периодичность
        
    - привязку (Company / Project / Order)
        
    - owner approval
        

### 5.3. Bonus & Payroll Ledger (ваш главный модуль)

#### Состояния бонуса (чтобы не было хаоса)

- **Earned** (событие случилось)
    
- **Pending Eligibility** (ждём KPI-гейт / acceptance / оплату)
    
- **Vested** (разрешено к выплате)
    
- **Holdback** (удержание)
    
- **Paid**
    
- **Clawback** (откат при refund/chargeback)
    

#### Правила для Sales (как у вас, но структурно)

- Earn event: Invoice → status “Paid” (финансист/CEO отмечает).
    
- %: 5–10% (по источнику лида).
    
- KPI gate:
    
    - ≥70% плана → 100% бонусов
        
    - 50–70% → 50% бонусов
        
    - <50% → 0% бонусов (сгорают)
        

#### Правила для Delivery (как у вас, но без дыр)

- Earn event: **Task/Work Package Done** + **Paid** (по соответствующему платежу).
    
- Выплата: в следующем payroll run (1–10 число).
    

#### Holdback + Cap (то, что вы просили “предложи”)

- **Holdback 20%** по delivery-бонусам: выплата через 14–30 дней после релиза/acceptance.
    
- **Cap** переменной части:
    
    - Delivery: max 100–200% фикса/мес (иначе управление превращается в казино)
        
    - Sales: cap лучше привязывать к **gross margin**, чтобы не продавать “убыточные радости”.
        

---

## 6) Project Management Framework (управление проектами)

Вы уже правильно заложили: для агентства часто лучше Kanban/Scrumban, чем “чистый Scrum”.

### 6.1. Delivery pipeline (единый стандарт)

Этапы: Intake → Planning → Execution → QA/Release → Close  
Definition of Done минимум фиксирован (PR, тест, документация, deploy, no blockers).

### 6.2. Handoff seller → PM (то, что у вас “не на высшем уровне”)

В Platform это делается не “пересказом в чате”, а обязательным **Project Kickoff Checklist**.

---

## 7) Sales & Marketing Pipeline (воронка)

### 7.1. Единая доска Sales (как вы хотите)

Lead/Deal + Extension как отдельный тип (визуально отличается), но **в одной очереди продаж**.

### 7.2. Правило “Change → Deal”

Любой платный запрос из support/чата:

- создаёт **Extension Deal**
    
- после оплаты создаёт **Order**
    
- дальше идёт как стандартный delivery-цикл
    

---

## 8) Product Development Lifecycle (для вашей NBOS Platform)

### 8.1. Что является продуктом

Пока это **internal product** (для Neetrino). Правильно.

### 8.2. Ритм разработки платформы

- Quarterly planning + rocks + приоритизация (как в NBOS фазе 3)
    
- Release checklist (потому что вы будете релизить систему, которая управляет деньгами)
    

---

## 9) Risk Management Model (риски и контроли)

### 9.1. Топ риски

- **Финансы**: некорректный P&L → неверные бонусы → кассовые разрывы.
    
- **Delivery**: отсутствие DoD/Release дисциплины → rework → падение маржи.
    
- **Support**: WhatsApp без triage → пропущенные запросы → churn.
    
- **Security**: хранение секретов “просто в CRM” → утечка.
    

### 9.2. Контроли

- Scorecard weekly + L10 + IDS (ваш управленческий контроль)
    
- ITIL-lite тикеты + SLA + KPI
    
- Audit logs по изменениям (вы хотите “не я менял”) → обязательно в Platform.
    

---

## 10) KPI & Metrics System (метрики)

Ваш NBOS задаёт правильный “скелет” Scorecard (5–15 метрик, weekly).

### Минимальный набор под вашу модель (Projects + 100 subscriptions)

- **Sales**: revenue/week, close rate, avg deal size, sales cycle, overdue invoices count
    
- **Delivery**: on-time %, variance, bugs to prod/week
    
- **Support**: SLA %, first response time, tickets closed/week, reopen rate %
    
- **Finance**: cash balance, overdue invoices, gross margin %, DSO
    
- **Recurring**: MRR (сумма подписок), churn/renewal rate
    

---

# Шаг 4 — Архитектура системы (слои и как это работает “в реальности”)

## Core Layer (Стратегия)

- V/TO, OKR-lite, pricing rules, product taxonomy (Project/Order/Work/Support)
    

## Management Layer (Операции)

- EOS cadence: L10 weekly, monthly finance review, quarterly planning
    
- Owners по функциям (Sales/Delivery/Support/Finance/etc.)
    

## Execution Layer (Проекты)

- **Project Hub** (центральная карточка проекта)
    
- Orders + Work Packages + Tasks
    
- Support tickets (ITIL-lite)
    

## Automation Layer (AI + CRM + процессы)

- Автосоздание invoice по subscription
    
- Интеграция WhatsApp/Telegram → Ticket/Task
    
- AI triage + автоответы (без секретов)
    
- Bank/payments sync
    

## Control Layer (Метрики, финансы, риски)

- Scorecard dashboard
    
- P&L (company/project/order)
    
- Audit logs
    
- SLA compliance
    

---

## Центральная сущность Platform: Project Hub (что именно вы просили)

**Project = контейнер контекста**, внутри которого всё связано:

- Overview (статус, этап, owner)
    
- Orders (development, extensions, subscription)
    
- Work (work packages: delivery/extension/maintenance)
    
- Tasks (агрегация задач)
    
- Finance (invoices/payments, P&L, overdue)
    
- Support (тикеты)
    
- Assets (Drive/Docs)
    
- Credentials (RBAC + audit)
    
- Messages (лог коммуникаций, интеграции)
    
- Audit (кто что менял)
    

---

# Шаг 5 — Roadmap внедрения (4 фазы)

Ниже я синхронизировал ваш NBOS план фаз (2–4 недели / 1–2 месяца / квартал).  
И добавил “Platform-реализацию”.

---

## Phase 1 — Stabilization (2–4 недели)

**Цель:** остановить расползание хаоса и зафиксировать “правила игры”.

**Внедряется:**

- Оргструктура L1–L2 + Owners (кто за что отвечает)
    
- Scorecard 10–15 цифр weekly
    
- L10 weekly
    
- Жёсткое разделение Projects vs Maintenance (очереди работ и правила)
    
- **Platform v0 (Read-only Project Hub)**: агрегатор ссылок/сущностей (без полной миграции)
    

**Инструменты:** текущий Bitrix + Google Drive + GitHub + WhatsApp/Telegram (без геройства).  
**Роли:** CEO, Head of Sales, Head of Delivery, Finance (пусть даже пока CEO), Support owner.

---

## Phase 2 — Structuring (1–2 месяца)

**Цель:** превратить процессы в стандарт и сделать “Project” реально центральным.

**Внедряется:**

- SOP на ключевые процессы: sales handoff, kickoff, release, triage
    
- SLA модель + приоритизация тикетов
    
- KPI по отделам уже “фактические”
    
- **Platform v1 (Write)**:
    
    - Project / Client separation
        
    - Orders + Invoices/Payments
        
    - Work Packages (delivery/extension/maintenance)
        
    - Support tickets
        
    - RBAC (seller/dev/finance/ops)
        

**Инструменты:** ваша Platform + минимальные интеграции (Drive links, repo links).  
**Роли:** добавляется Finance как отдельный участник процесса, Support triage owner.

---

## Phase 3 — Automation (квартал)

**Цель:** убрать ручной труд, который сегодня “держится на вас”.

**Внедряется:**

- Quarterly planning + rocks
    
- DoD + релиз чек-листы + минимум техдоки
    
- Авто-генерация инвойсов по subscription
    
- Bonus Ledger автоматизация (earned/vested/holdback/payout)
    
- Интеграции WhatsApp/Telegram → тикеты
    
- AI triage/auto-reply (с AI policy)
    

**Инструменты:** очереди/воркфлоу, интеграции, audit logs.

---

## Phase 4 — Scaling

**Цель:** выдержать рост “20 проектов в пике” → “больше”, без деградации качества.

**Внедряется:**

- Capacity planning (сколько реально можем взять)
    
- BI/дашборды по марже, MRR, churn
    
- Риск-регистр + регламенты инцидентов
    
- Опционально: timesheets (если решите считать себестоимость точнее)
    

---

# IDS Backlog (открытые решения, которые надо зафиксировать)

Это не “вопросики”. Это список решений, которые обязаны быть приняты, иначе платформа будет “недостроенным мостом”:

1. Формула Delivery-бонусов: % от оплаты/этапа/маржи (и деление при 30/30/40).
    
2. Cap и holdback значения (я рекомендовал 20% holdback и cap на variable).
    
3. Модель секретов: self-hosted vault vs хранение в Platform (второе дороже и рискованнее).
    
4. Subscription пакеты (хотя бы внутренняя градация приоритета P1–P3)
    
5. Политика clawback (refund/неоплата/спор).
    

---

Если коротко: **NBOS как методология у вас уже сильная** (EOS cadence, scorecard, delivery/support стандарты).  
Теперь вы превращаете это в **NBOS Platform**, где Project Hub становится “единственной правдой”, а бонусы/финансы/поддержка перестают жить в отдельных вселенных.