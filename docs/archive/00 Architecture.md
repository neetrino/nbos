Норм. У тебя сейчас список “как в меню ресторана: есть всё, но непонятно, что с чем едят”. Я привожу это к **правильной архитектуре системы**, где:

- **Project Hub** = центральный контейнер контекста
    
- CRM/Finance/Tasks/Support/Drive/Messenger = **модули и представления**, но данные связаны одной моделью
    
- “Доски” = это **views**, а не отдельные “миры”
    

Ниже готовая структура (можешь копировать как основу навигации и модулей).

---

## Целевая структура NBOS Platform (Navigation + Modules)

### 1) CRM (Sales Workspace)

1. **Leads**
    
2. **Deals (Pipeline)**
    
3. **Extensions Deals** (тот же pipeline, но тип “Extension” и визуально отличается)
    
4. **Offers / Proposals** (коммерческое предложение)
    
5. **Activities** (звонки, встречи, follow-ups)
    
6. **Handoffs** (Seller → PM/Delivery: обязательный пакет данных)
    
7. **Sales Analytics**
    
    - conversion
        
    - revenue forecast
        
    - source performance (marketing/partner/referral/cold)
        

> Принцип: CRM отвечает за “привести деньги”, а не за управление проектом.

---

### 2) Projects Hub (Core)

Это **главный пункт меню**. Здесь живёт “правда” по каждому проекту.

**2.1 Projects (List)**

- Active / On Hold / Done / Archived
    
- Фильтры: owner, stage, client, type (web/app/crm), risk, subscription yes/no
    

**2.2 Project Card (внутри проекта вкладки)**

1. **Overview**
    
    - статус, стадия, owner, приоритет, краткое описание
        
2. **Commercial (Orders)**
    
    - все заказы проекта: Development / Extension / Subscription / Partner-service
        
    - связь: Deal → Order → Invoice → Payment
        
3. **Work (Work Packages)**
    
    - Delivery packages (этапы/спринты)
        
    - Extension packages (1 день / 1 неделя / 1 месяц)
        
    - Maintenance packages (месяц обслуживания)
        
4. **Tasks**
    
    - агрегатор задач по проекту (с фильтрами)
        
5. **Support**
    
    - тикеты/обращения (Incident/Request/Change/Problem)
        
6. **Finance (Project P&L)**
    
    - доходы/расходы/маржа, задолженности, прогноз
        
7. **Assets**
    
    - Drive links, документы, файлы, ссылки на репозитории
        
8. **Credentials (ограниченно)**
    
    - секреты/доступы по ролям + аудит
        
9. **Messages**
    
    - проектный чат + лог коммуникации + “темы”
        
10. **Timeline / Audit**
    

- события: оплата пришла, релиз, изменение доступа, закрытие этапа
    

> Важно: Project хранит контекст. Продажи и исполнение просто “пришиты” к нему.

---

### 3) Work & Task System (Delivery Workspace)

1. **Boards (Views)**
    
    - Delivery Board (проекты/этапы)
        
    - Extensions Board
        
    - Maintenance Board (если надо внутри Delivery)
        
2. **Tasks**
    
    - backlog / in progress / review / done
        
3. **Templates**
    
    - kickoff checklist, release checklist, типовые таски
        
4. **QA**
    
    - баги, регресс, чек-листы релиза
        
5. **(Опционально позже) Time / Effort**
    
    - если решишь вводить учёт времени
        

---

### 4) Clients (CRM + Ops Core)

1. **Companies**
    
2. **Contacts**
    
3. **Client Portfolio**
    
    - какие Projects у клиента
        
    - какие Subscriptions
        
4. **Client Communication**
    
    - каналы связи, группы, правила
        
5. **Contracts & Docs**
    
    - договоры, акты, реквизиты (если нужно)
        

> Client ≠ Project. Клиент может иметь несколько проектов (бренды, сайты, приложения).

---

### 5) Finance (Finance Workspace)

**5.1 Revenue / AR**

1. **Invoices**
    
2. **Payments**
    
3. **Overdue / DSO**
    
4. **Orders (в разрезе денег)**
    

**5.2 Subscriptions**  
5. **Subscriptions (Contracts)**  
6. **Monthly Billing Run**  
7. **Renewals / Risks (churn)**

**5.3 Costs / AP**  
8. **Planned Expenses** (recurring: domain/hosting/tools)  
9. **Unplanned Expenses** (разовые)  
10. **Live Expenses Feed** (оперативная лента)

**5.4 Payroll**  
11. **Salary**  
12. **Bonus Ledger**

- earned / pending / vested / holdback / paid / clawback
    

**5.5 Assets & Infra money**  
13. **Domains**  
14. **Hosting / Servers**  
15. **Licenses / Tools**

**5.6 Analytics**  
16. **Company P&L**  
17. **Project P&L**  
18. **Subscription MRR**  
19. **Forecast / Planning (Budget, Cashflow)**

> Финансы должны жить отдельно, но быть открываемыми из Project одним кликом.

---

### 6) My Company (Company OS)

1. **Org Structure**
    
    - departments, owners, accountability
        
2. **Team / Employees**
    
    - роли, уровень доступа, грейды (junior и т.д.)
        
3. **Permissions (RBAC)**
    
    - seller/dev/pm/finance/ops/support + матрица доступов
        
4. **SOP & Templates**
    
    - процессы, чек-листы, регламенты
        
5. **KPI / Scorecard**
    
    - weekly numbers, L10 подготовка
        
6. **Rocks / Goals (OKR-lite)**
    
7. **HR**
    
    - onboarding/offboarding, обучение
        

---

### 7) Partners

1. **Partner Directory**
    
2. **Referral Deals**
    
3. **Revenue Share**
    
4. **Partner Subscriptions (если есть)**
    
5. **Partner Performance**
    
6. **Agreements / Docs**
    

---

### 8) Messenger (Communications Layer)

1. **Internal 1:1**
    
2. **Internal Group Chats**
    
3. **Project Chats** (с темами)
    
4. **Task Threads** (комментарии/обсуждения в задаче)
    
5. **Client Chats**
    
    - привязка к Client + Project
        
    - входящие → triage → ticket/task
        

> Мессенджер не должен становиться “местом хранения решений”. Он должен создавать тикеты/задачи и фиксировать итоги.

---

### 9) Calendar

1. **Client Meetings**
    
2. **Team Availability / Working Hours**
    
3. **Delivery Cadence**
    
    - демо, релизы, планирования
        
4. **Renewals / Billing reminders**
    
5. **Resource conflicts** (нельзя назначить 2 встречи одному человеку)
    

---

### 10) Drive (Assets Layer)

1. **Project Folders (автоструктура)**
    
2. **Client Library**
    
3. **Company Library**
    
    - templates, brand assets, SOP exports
        
4. **Access Control**
    
    - кто видит что, журнал действий
        
5. **Quick Attach**
    
    - “прикрепить файл к Project/Deal/Invoice/Task” без цирка
        

---

## Ключевая правка твоего списка (чтобы стало “правильно”)

### Что добавить/переименовать обязательно

- В Finance: **Payments** отдельно от “Monthly payments” (платежи бывают не только monthly)
    
- **Support** как отдельный модуль/вид (не прятать внутри Tasks), потому что у тебя 100 подписок
    
- В Projects Hub: разделить **Orders** и **Work Packages** (иначе бонусы и финансы будут вечной болью)
    

### Что считать “ядром данных”

Если коротко, ядро сущностей:

- Company, Contact
    
- Project
    
- Deal (CRM)
    
- Order
    
- Subscription
    
- Invoice, Payment
    
- Cost (planned/unplanned)
    
- Work Package
    
- Task
    
- Ticket (Support)
    
- Credential, Asset
    
- Bonus Ledger entry
    
- Message, Meeting
    
- Partner
    

