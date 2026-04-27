# UI Shell Cleanup Register

> NBOS UI Shell - что нужно привести к новому канону navigation, header, sidebar и personal navigation.

## Назначение

Этот файл фиксирует расхождения между текущей реализацией / старыми документами и новым каноном `Navigation and UI Shell`.

Новый канон:

- Sidebar = карта платформы;
- Dashboard = персональный Control Center;
- Header = глобальные действия;
- Module Shell = контекстные actions/views/filters;
- Team живёт внутри My Company;
- My Account открывается из header user menu;
- Departments живут в My Company;
- Settings содержит только системную админку;
- глобальной кнопки `Create` в header нет;
- пользователь может персонально менять порядок sidebar, скрывать пункты и добавлять My Links;
- My Links доступны и в sidebar, и в Dashboard pinned actions.

---

## A. Already aligned / Уже совпадает с каноном

### A1. Sidebar exists

Статус: `PARTIAL UI`

Runtime уже имеет sidebar, collapse mode, active states и RBAC visibility.

Остаток: привести структуру пунктов к новому канону.

### A2. Header user menu opens My Account

Статус: `PARTIAL UI`

Runtime уже имеет переход в `/my-account` из user menu.

Остаток: убрать My Account из Settings navigation.

### A3. Dashboard exists as first screen

Статус: `PARTIAL UI`

Runtime уже имеет `/dashboard`.

Остаток: сделать его Control Center с pinned actions и priority feed.

---

## B. Runtime / UI stale

### B1. Team is still top-level sidebar item

Статус: `STALE UI`

`Team` должен быть внутри:

```text
My Company -> Team
```

Нужно добавить top-level `My Company` и перенести туда Team, Departments, Roles & Seats, Compensation, KPI, SOP.

### B2. Settings contains My Account

Статус: `STALE UI`

`My Account` не должен быть подпунктом Settings.

Правильно:

```text
Header User Menu -> My Account
```

### B3. Settings contains Departments

Статус: `STALE UI`

`Departments` должны жить в:

```text
My Company -> Departments
```

### B4. Topbar contains global Create button

Статус: `STALE UI`

Глобальная кнопка `Create` должна быть удалена из header.

Правильные места:

- Dashboard pinned actions;
- module header;
- command palette later.

### B5. Sidebar search and header search may be duplicated

Статус: `NEEDS DESIGN DECISION`

Runtime имеет search entry в sidebar. Canon допускает global search в header/sidebar, но нужно выбрать единый UX:

- один visible entry;
- одинаковый `Cmd/Ctrl + K`;
- один search modal.

### B6. Finance/CRM sidebar children are incomplete

Статус: `STALE UI`

Runtime finance children не соответствуют новому Finance canon:

- нет Salary Board;
- нет Bonus Board;
- нет Client Services;
- нет Expense Plans / Expense Backlog separation;
- Orders может быть stale naming.

CRM children тоже должны быть приведены к CRM canon:

- Leads;
- Deals;
- CRM Client Chats;
- Sales Analytics / Reports.

### B7. Marketing top-level module is missing

Статус: `MISSING UI`

По новому канону Marketing должен быть отдельным top-level module:

```text
Marketing
  Marketing Board
  Attribution Review
  Marketing Dashboard
  Marketing Settings
```

CRM использует marketing attribution fields, но Marketing operations не должны быть спрятаны внутри CRM.

---

## C. Runtime missing / Needs implementation

### C1. My Company top-level module is missing

Статус: `MISSING UI`

Нужно добавить:

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

### C2. Personal Navigation preferences are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить возможность:

- reorder sidebar top-level modules;
- hide modules into More / Hidden;
- restore hidden modules;
- save preferences per user.

### C3. My Links are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить personal links:

- internal NBOS URL;
- external URL;
- title;
- icon/color;
- open in new tab;
- show in sidebar;
- show in dashboard.

### C4. Dashboard and sidebar do not share personal links

Статус: `MISSING CODE`

Personal Links должны быть единым механизмом:

```text
PersonalLink -> Sidebar My Links
PersonalLink -> Dashboard Pinned Actions
```

### C5. Module shell is not standardized

Статус: `NEEDS DESIGN / NEEDS UI REFACTOR`

Нужно унифицировать:

- module header;
- filters;
- view switcher;
- contextual create/actions;
- tabs;
- empty/loading/error states.

### C6. Entity opening rules are not standardized

Статус: `NEEDS DESIGN`

Нужно применить правило:

```text
Quick inspect -> drawer.
Short action -> modal.
Deep work -> full page.
```

---

## D. Implementation order

1. Remove global `Create` from Topbar.
2. Remove `My Account` from Settings sidebar children.
3. Remove `Departments` from Settings sidebar children.
4. Add `My Company` top-level item.
5. Move `Team` under `My Company`.
6. Align Settings children with Settings/Admin canon.
7. Align Finance/CRM sidebar children with module canons.
8. Add Marketing top-level module.
9. Add Personal Navigation data model.
10. Add reorder/hide sidebar preferences.
11. Add My Links.
12. Share My Links with Dashboard pinned actions.
13. Standardize Module Shell.

## E. Non-goals for MVP

В MVP не нужно:

- fully customizable sidebar for all nested items;
- visual sidebar builder for admins;
- right rail if workflow is not confirmed;
- custom icons upload for personal links;
- complex enterprise menu policies.
