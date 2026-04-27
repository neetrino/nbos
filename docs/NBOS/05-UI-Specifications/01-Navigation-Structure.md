# Navigation and UI Shell

> NBOS Platform - общий каркас интерфейса: sidebar, header, breadcrumbs, module shell, personal navigation и responsive behavior.

## Назначение

`Navigation / UI Shell` задаёт единый каркас платформы, чтобы все модули NBOS ощущались как одна система.

Главный принцип:

```text
Sidebar = карта платформы.
Dashboard = персональный пульт управления.
Header = глобальные действия.
Module Shell = контекст конкретного модуля.
```

Навигация адаптируется по RBAC: пользователь видит только те пункты, к которым у него есть доступ.

---

## Основные слои UI Shell

```text
App Shell
  Sidebar
  Header / Topbar
  Breadcrumbs
  Module Header
  Module Tabs / Views
  Entity Drawer / Modal / Full Page
  Optional Right Rail
```

### Sidebar

Главная карта модулей NBOS.

### Header / Topbar

Глобальная верхняя панель для действий, нужных почти на любой странице.

### Breadcrumbs

Контекстная навигация внутри проектов, продуктов, сделок и карточек.

### Module Header

Зона конкретного модуля: title, filters, view switcher, contextual actions.

### Entity Drawer / Modal / Full Page

Единые правила открытия карточек сущностей.

---

## Sidebar canon

Sidebar содержит top-level модули, а не все возможные действия.

Канонический порядок по умолчанию:

```text
Dashboard
Reports / Analytics
CRM
Marketing
Project Hub
Tasks
Finance
Support
Clients
Partners
Messenger
Calendar
Drive
Credentials
My Company
Settings / Admin
```

### Dashboard

- Путь: `/dashboard`
- Назначение: персональный Control Center / пульт управления.
- Доступ: все авторизованные пользователи.

Dashboard не является analytics-only страницей. Быстрые действия, pinned actions и важные карточки живут здесь.

### Reports / Analytics

Подпункты:

```text
Reports / Analytics
  Report Catalog
  Scheduled Reports
  Export History
  Saved Views
```

Reports / Analytics - read-only слой глубокого анализа:

- отчёты за период;
- сравнения;
- drill-down;
- exports;
- scheduled reports;
- data quality warnings.

Правило:

```text
Dashboard = что требует внимания сейчас.
Reports = что произошло и что это значит.
```

### CRM

Подпункты:

```text
CRM
  Leads
  Deals
  CRM Client Chats
  Sales Reports / Analytics
```

CRM отвечает за Lead/Deal pipeline, offers, stage gates и клиентские pre-sale коммуникации.
`Sales Reports / Analytics` является CRM-owned view и также отображается в `Reports / Analytics` catalog.

### Marketing

Подпункты:

```text
Marketing
  Marketing Board
  Attribution Review
  Marketing Dashboard / module analytics
  Marketing Settings
```

Marketing является рабочим модулем маркетингового отдела:

- планирование и запуск активностей;
- каналы и аккаунты;
- связь с Finance expenses;
- attribution для CRM Lead/Deal;
- анализ лидов, MQL/SQL/Won и revenue by source.

Marketing и CRM связаны, но не являются одним модулем:

```text
Marketing creates/tracks demand.
CRM processes leads/deals.
```

### Project Hub

Подпункты:

```text
Project Hub
  Projects
  Products / Delivery Board
  Extensions
  Closed / Archived
```

Project Hub - продуктово-центричный центр проектов, продуктов и extensions.

### Tasks

Подпункты:

```text
Tasks
  My Tasks
  All Tasks
  Work Spaces
  Templates / Recurring
```

Work Space является отдельной сущностью внутри task ecosystem, но доступен из Tasks и из Product page.

### Finance

Подпункты:

```text
Finance
  Invoices
  Subscriptions
  Expense Plans
  Expense Board
  Expense Backlog
  Client Services
  Domains / Hosting / Licenses
  Bonus Board
  Salary Board
  Partner Payouts
  Finance Reports / P&L
```

Finance-owned reports хранят финансовые определения и формулы. Глобальный `Reports / Analytics` показывает эти отчёты в catalog, exports и scheduled reports, но не дублирует finance logic.

### Support

Подпункты:

```text
Support
  Tickets
  Support Reports / Dashboard
  Knowledge / FAQ later
```

### Clients

Подпункты:

```text
Clients
  Companies
  Contacts
  Client Portfolio
```

Company и Contact имеют разные смыслы, но client profile может собирать связи в одном удобном UI.

### Partners

Подпункты:

```text
Partners
  Partner Directory
  Partner Balance / Payouts
  Partner Agreements
  Partner Portal v2
```

### Messenger

Messenger должен разделять internal и external коммуникации.

```text
Messenger
  Internal
  External
  Favorites / Collections
```

Internal и External нельзя смешивать в одном рабочем списке без явного visual boundary.

### Calendar

Пока calendar top-level показывает только важные слои:

```text
Calendar
  Meet
  Delivery Deadlines
  Personal
```

Finance calendar живёт внутри Finance.

### Drive

Подпункты:

```text
Drive
  Library
  Projects
  Shared
  Storage / Cleanup
```

Drive работает через logical links к сущностям и physical storage metadata.

### Credentials

Подпункты:

```text
Credentials
  Vault
  My Access
  Reviews
  Audit
```

### My Company

`Team` не должен быть top-level пунктом.

```text
My Company
  Org Structure
  Team
  Departments
  Roles & Seats
  Compensation
  KPI / Scorecard
  SOP & Templates
```

Default page: `Org Structure`.

### Settings / Admin

Settings - системная админка платформы.

```text
Settings / Admin
  General
  System Lists
  Permissions / RBAC
  Module Settings
  Integrations
  Security
  Feature Flags
  Audit Log
```

Settings не содержит:

- My Account;
- Departments;
- Team;
- Compensation;
- KPI / Bonus policies;
- SOP.

---

## Personal Navigation

NBOS должен позволять пользователю сделать sidebar удобным для своей работы, но не разрушать карту платформы.

### 1. Reorder sidebar modules

Пользователь может менять порядок доступных top-level пунктов sidebar для себя.

Пример:

- Seller поднимает `CRM`;
- PM поднимает `Project Hub` и `Tasks`;
- Finance поднимает `Finance`;
- Owner оставляет company-wide порядок.

Это personal preference, не глобальная настройка.

### 2. Hide rarely used modules

Пользователь может скрыть редко используемые доступные пункты.

Скрытые пункты не исчезают из системы. Они попадают в:

```text
More / Hidden
```

Оттуда пользователь может вернуть пункт обратно.

Важно: если у пользователя нет permission, пункт не появляется даже в hidden list.

### 3. My Links / Personal Links

Пользователь может создать личные ссылки.

Ссылка может вести:

- на внутреннюю страницу NBOS;
- на внешний URL;
- на документ;
- на external service;
- на часто используемый канал/страницу.

Примеры:

- YouTube channel;
- Google Sheet;
- external analytics;
- client admin panel;
- internal NBOS filtered board.

Поля personal link:

```text
PersonalLink
  title
  url
  icon
  color
  open_in_new_tab
  show_in_sidebar
  show_in_dashboard
```

### 4. Security for external links

Для внешних ссылок:

- показывать external badge;
- открывать по умолчанию в новой вкладке;
- валидировать URL;
- запрещать dangerous protocols;
- audit не обязателен для личной ссылки, но admin policy может ограничивать external links.

### 5. Shared model with Dashboard

Personal Links должны быть доступны и в Dashboard pinned actions.

```text
PersonalLink -> Sidebar My Links
PersonalLink -> Dashboard Pinned Actions
```

Это не два разных механизма, а один источник personal navigation.

---

## Header / Topbar canon

Header должен быть лёгким и глобальным.

Содержит:

- global search / quick switcher;
- notifications;
- messenger shortcut, если включено;
- user profile / My Account;
- session menu.

Header не содержит постоянную глобальную кнопку `Create`.

Причина: создание почти всегда контекстное. `New Lead`, `New Task`, `New Invoice`, `New Ticket`, `New Expense`, `New Credential` имеют разные права, поля и процессы.

Правильные места для create actions:

- Dashboard pinned actions;
- module header;
- entity context;
- command palette later.

---

## Global Search / Quick Switcher

Global search должен открываться из header или sidebar search.

Ищет по:

- Projects;
- Products;
- Deals;
- Leads;
- Tasks;
- Tickets;
- Companies;
- Contacts;
- Invoices;
- Subscriptions;
- Drive files;
- Credentials metadata, но не secret values.

Hotkey:

```text
Cmd/Ctrl + K
```

В будущем search может стать command palette:

```text
Open Invoice
Create Task
Go to Product
Open My Links
```

---

## Module Shell

Каждый модуль должен иметь единый каркас.

```text
Module Page
  Module Header
  Tabs / Section Navigation
  Filters
  View Switcher
  Context Actions
  Main Content
```

### Module Header

Содержит:

- title;
- short description/status;
- contextual create button;
- secondary actions;
- filters/search if they apply to whole module.

### Tabs / Section Navigation

Используется внутри модуля или entity page.

Пример Product:

```text
Overview
Work Space
Tasks
Files
Credentials
Support
Finance
Technical
Audit
```

### View Switcher

Если модуль поддерживает разные отображения:

- Board;
- List;
- Grid;
- Calendar;
- Matrix;
- Timeline.

Последний выбранный вид сохраняется как user preference.

---

## Entity opening rules

### Drawer

Использовать для быстрых карточек:

- task;
- deal quick view;
- invoice quick view;
- ticket quick view;
- contact quick view.

### Modal

Использовать для коротких действий:

- confirm;
- small create form;
- approve/reject;
- stage gate missing fields.

### Full page

Использовать для сложных сущностей:

- Project;
- Product;
- Work Space;
- Client profile;
- Employee profile;
- Credentials vault item details, если нужен безопасный full context.

Правило:

```text
Quick inspect -> drawer.
Short action -> modal.
Deep work -> full page.
```

---

## Breadcrumbs

Breadcrumbs показывают путь в сложной иерархии.

Примеры:

```text
Home > Project Hub > Marco.am > Website > Work Space
Home > CRM > Deals > Deal #123
Home > Finance > Invoices > Invoice #INV-2026-0042
Home > Support > Tickets > Ticket #TKT-1205
```

При глубокой вложенности middle items можно сворачивать в `...`.

---

## Right Rail

Right rail пока не обязательный MVP-элемент.

В будущем он может содержать:

- messenger quick access;
- notifications;
- recent items;
- pinned links;
- active call/chat;
- AI assistant later.

Правило для MVP:

```text
Do not force right rail until it solves a real workflow.
```

Если right rail появится, он не должен дублировать sidebar и Dashboard pinned actions.

---

## Mobile / Tablet behavior

### Desktop

- sidebar visible;
- header visible;
- module shell full;
- drawers available.

### Tablet

- sidebar collapsible;
- module tabs horizontally scrollable;
- filters can collapse.

### Mobile

- sidebar behind hamburger;
- header simplified;
- search icon only;
- breadcrumbs shortened;
- primary actions move into module action menu;
- dashboard pinned actions become horizontal scroll or grid.

---

## RBAC and visibility

Navigation visibility uses:

- permission role;
- entity scope;
- feature flags;
- module availability;
- personal hide preferences.

Priority:

```text
No permission -> never show.
Feature disabled -> never show.
User hidden -> show in More / Hidden.
User pinned/personal -> show in selected area.
```

---

## Runtime cleanup notes

Current runtime should be aligned:

- remove top-level `Team`;
- add `My Company` top-level item;
- move Team/Departments under `My Company`;
- remove `My Account` from Settings navigation;
- remove `Departments` from Settings navigation;
- remove global `Create` button from Topbar;
- add Dashboard pinned actions later;
- add Personal Navigation preferences later.
