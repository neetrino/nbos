# My Company Overview

> NBOS Platform - модуль компании: структура, люди, seats, KPI, compensation, SOP и организационная навигация.

## Назначение

`My Company` - это центр управления внутренней компанией Neetrino.

Он отвечает за:

- кто работает в компании;
- кто за что отвечает;
- какие функции существуют;
- какие функции закрыты людьми, а какие vacant;
- какие KPI и bonus policies применяются;
- какие compensation profiles действуют;
- какие SOP описывают работу отделов.

Главный принцип: `My Company` описывает бизнес-структуру, а не системные настройки. Системная админка живёт в `Settings`.

---

## Основные разделы

| Раздел            | Назначение                                                        |
| ----------------- | ----------------------------------------------------------------- |
| `Org Structure`   | Визуальная структура отделов и seats                              |
| `Team`            | Список сотрудников и карточки сотрудников                         |
| `Departments`     | Отделы, владельцы, подотделы, KPI                                 |
| `Roles & Seats`   | Бизнес-функции и accountability                                   |
| `Compensation`    | Compensation profiles, bonus policies, KPI policies               |
| `KPI / Scorecard` | Company / department / employee KPI                               |
| `SOP & Templates` | Процедуры, onboarding, offboarding, recurring operating processes |

---

## Core entities

```text
Department
  -> Seat
    -> Seat Assignment
      -> Employee
        -> Compensation Profile
        -> KPI Policy / KPI Plan / KPI Result
        -> Bonus Policy
```

### Department

Отдел компании: Sales, Marketing, Delivery, Support, Finance, HR, Operations, Executive.

### Seat

Бизнес-функция внутри отдела: Seller, PM, Developer, Finance Director, Head of Sales.

Seat существует даже если человек ещё не назначен. Это позволяет видеть вакансии и слабые места структуры.

### Seat Assignment

Назначение сотрудника на seat.

Один сотрудник может занимать несколько seats:

```text
CEO:
- CEO / Visionary
- Finance Director
- Operations Manager
```

### Employee

Человек в компании. Employee не должен хранить всю бизнес-логику в одном поле `role`. Его бизнес-функции идут через seat assignments.

### Compensation Profile

Версия условий оплаты сотрудника: фикс, валюта, график выплат, bonus policy, KPI policy.

### KPI Policy / Bonus Policy

Правила мотивации и оценки эффективности. Они могут применяться на уровне department, seat, level или employee.

---

## Main UX concept

Главный экран `My Company` должен открываться с `Org Structure`.

### Org Chart

Визуально это canvas в стиле Bitrix24:

- карточки отделов;
- линии подчинения;
- zoom;
- search;
- collapse / expand;
- add button;
- правый drawer при клике;
- быстрый переход к выбранному отделу.

Но NBOS должен быть глубже Bitrix: карточка отдела показывает не просто людей, а seats, vacancies, KPI и budget summary.

### Department card

Карточка отдела показывает:

- name;
- head / owner;
- employees count;
- seats count;
- vacant seats;
- KPI status;
- children count.

### Department drawer

Клик по отделу открывает:

- details;
- subdepartments;
- seats;
- employees;
- vacant seats;
- KPI;
- compensation budget summary;
- linked SOP;
- audit.

### Seat drawer

Клик по seat открывает:

- accountability;
- current assignee;
- allocation percent;
- backup / deputy;
- required skills;
- KPI policy;
- bonus policy;
- default permission role;
- assignment history.

---

## Views

`My Company` должен поддерживать несколько видов:

| View               | Назначение                          |
| ------------------ | ----------------------------------- |
| `Org Chart`        | Визуальная карта компании           |
| `Departments List` | Таблица отделов                     |
| `Seats List`       | Все seats с фильтрами по статусу    |
| `Assignments`      | Кто какие seats занимает            |
| `Employees`        | Список сотрудников                  |
| `Vacancies`        | Vacant seats и открытые функции     |
| `Compensation`     | Профили оплаты и policies           |
| `KPI`              | KPI company / department / employee |

---

## My Company vs Settings

| My Company             | Settings                   |
| ---------------------- | -------------------------- |
| Departments            | System lists               |
| Seats / business roles | Technical permission roles |
| Employees              | Integrations               |
| Compensation profiles  | Platform general settings  |
| Bonus policies         | Audit log                  |
| KPI policies           | API / webhooks             |
| SOP                    | Security defaults          |

`My Account` не находится в Settings. Он открывается из header user menu.

---

## Связи с другими модулями

```text
My Company -> Finance
  Compensation Profile, Bonus Policy, KPI Policy -> Payroll

My Company -> Projects Hub
  Employees, seats, availability -> resource planning

My Company -> Tasks
  Employee assignments, onboarding/offboarding tasks

My Company -> Credentials
  Seat / permission mapping, offboarding access revoke

My Company -> Dashboards
  KPI, scorecard, team capacity, org health
```

---

## Связанные документы

- [01-Org-Structure.md](./01-Org-Structure.md) - оргструктура, departments, seats, assignments.
- [02-Team-Employees.md](./02-Team-Employees.md) - сотрудники и карточка сотрудника.
- [03-RBAC-Permissions.md](./03-RBAC-Permissions.md) - technical permission roles и доступы.
- [04-KPI-Scorecard.md](./04-KPI-Scorecard.md) - KPI policies и scorecard.
- [05-SOP-Templates.md](./05-SOP-Templates.md) - SOP и процедуры.
- [06-My-Company-Cleanup-Register.md](./06-My-Company-Cleanup-Register.md) - cleanup register.
