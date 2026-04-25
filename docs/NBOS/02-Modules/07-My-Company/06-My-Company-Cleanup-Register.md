# My Company Cleanup Register

> NBOS My Company - что нужно привести к новому канону после обсуждения org, team, KPI, compensation и bonus policy.

## Назначение

Этот файл фиксирует расхождения между текущей реализацией / старыми документами и новым каноном `My Company`.

Новый канон:

- `My Company` является top-level модулем для оргструктуры, сотрудников, ролей, KPI, compensation и SOP;
- `Team` является подпунктом `My Company`, а не отдельным top-level пунктом sidebar;
- `My Account` открывается из header user menu, а не из Settings;
- `Settings` содержит системную админку, а не бизнес-структуру компании;
- `Compensation Profile` хранит условия оплаты сотрудника с историей версий;
- `Bonus Policy` и `KPI Policy` универсальны для всех отделов, ролей, уровней и сотрудников;
- Finance использует policies из My Company, но не придумывает роли и мотивацию сам.

---

## A. Already aligned / Уже совпадает с каноном

### A1. Docs already define My Company as a module

Статус: `OK DOCS`

Документы уже содержат `My Company` как модуль:

- [01-Org-Structure.md](./01-Org-Structure.md)
- [02-Team-Employees.md](./02-Team-Employees.md)
- [03-RBAC-Permissions.md](./03-RBAC-Permissions.md)
- [04-KPI-Scorecard.md](./04-KPI-Scorecard.md)
- [05-SOP-Templates.md](./05-SOP-Templates.md)

### A2. Navigation canon already includes My Company

Статус: `OK DOCS`

[01-Navigation-Structure.md](../../05-UI-Specifications/01-Navigation-Structure.md) now treats `My Company` as a sidebar module and `Team` as its child.

---

## B. Runtime / UI stale

### B1. Sidebar currently shows Team as top-level item

Статус: `STALE UI`

Current UI shows `Team` directly in the sidebar. It should move under:

```text
My Company -> Team
```

Future implementation:

- add `My Company` top-level sidebar item;
- move `Team` under `My Company`;
- add `Org Structure`, `Compensation`, `KPI / Scorecard`, `Roles & Seats`, `Departments`, `SOP`;
- hide items by RBAC.

### B2. My Account currently appears inside Settings

Статус: `STALE UI`

`My Account` is a personal profile screen and should open from the header user menu.

Future implementation:

- remove `My Account` from Settings navigation;
- open account from header user dropdown;
- keep profile, notifications and security under account area.

### B3. Settings mixes system configuration with business structure

Статус: `STALE UI / STALE INFORMATION ARCHITECTURE`

Settings should contain system administration only:

- General;
- System Lists;
- Permissions / technical RBAC;
- Integrations;
- Audit Log.

Business objects should move to `My Company`:

- departments;
- seats / business roles;
- levels;
- employees;
- compensation profiles;
- KPI policies;
- bonus policies.

---

## C. Runtime missing

### C1. Compensation Profile is not the source of truth yet

Статус: `MISSING CODE`

Employee currently may still contain simple salary fields. New canon requires:

- versioned `Compensation Profile`;
- base salary;
- payout schedule;
- active bonus policy;
- active KPI policy;
- effective dates;
- archive old versions instead of overwriting.

### C2. Bonus Policy is not implemented as universal policy layer

Статус: `MISSING CODE`

New canon requires `Bonus Policy` for all roles, not only Seller.

Policy must support:

- department defaults;
- seat/position defaults;
- level defaults;
- employee-specific override;
- product category / product type for delivery roles;
- lead source / deal type / payment type for sales;
- effective dates and audit.

### C3. KPI Policy is not implemented as universal policy layer

Статус: `MISSING CODE`

New canon requires:

- KPI templates by role/department;
- KPI policies by department, seat, level and employee;
- KPI plans by period;
- KPI results;
- KPI gate results for payroll;
- optional manual adjustments with reason.

### C4. Business roles and system permissions need separation

Статус: `NEEDS REFACTOR`

`Role` can mean two different things:

- business role / seat: Seller, PM, Developer, Head of Sales;
- system permission role: Admin, Finance Admin, Viewer.

Future implementation must separate:

- `Seat / Position` in My Company;
- `Permission Role` in Settings / RBAC.

---

## D. Recommended implementation order

1. Add `My Company` sidebar and move `Team` under it.
2. Remove `My Account` from Settings and open it from header user menu.
3. Split business roles/seats from technical permission roles.
4. Add versioned `Compensation Profile`.
5. Add `Bonus Policy` and `KPI Policy` templates and active policies.
6. Connect policies to Finance payroll and bonus release.
7. Add KPI dashboards and employee wallet projections.
