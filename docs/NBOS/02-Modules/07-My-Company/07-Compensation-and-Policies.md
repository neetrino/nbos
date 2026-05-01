# Compensation and Policies

> NBOS Platform - My Company: compensation profiles, bonus policies, KPI policies, templates, overrides and UI.

## Назначение

`Compensation / Оплата и политики` - это раздел `My Company`, где CEO/HR/Finance управляют условиями оплаты и правилами мотивации сотрудников.

Этот раздел не выплачивает деньги сам. Он хранит правила, которые Finance использует в:

- Bonus Board;
- Payroll Run;
- Salary Board;
- Employee Wallet;
- P&L reports.

Главный принцип: `My Company` задаёт правила, `Finance` считает и выплачивает по этим правилам.

---

## Что входит в раздел Compensation

| Экран / объект          | Русское название          | Смысл                                                      |
| ----------------------- | ------------------------- | ---------------------------------------------------------- |
| `Compensation Profiles` | Профили оплаты            | Фикс, валюта, график выплат, активные policies сотрудника  |
| `Bonus Policies`        | Правила бонусов           | Как считать бонусы для отдела, seat, уровня или сотрудника |
| `KPI Policies`          | Правила KPI               | Как считать KPI и как KPI влияет на бонусы                 |
| `Policy Templates`      | Шаблоны правил            | Безопасные готовые типы правил                             |
| `Employee Overrides`    | Индивидуальные исключения | Персональные условия сотрудника                            |
| `Effective Dates`       | Периоды действия          | С какой даты действуют правила                             |
| `Policy Audit`          | История изменений         | Кто, когда и почему изменил условия                        |

---

## Rule hierarchy / Иерархия правил

Правила применяются сверху вниз, но более конкретное правило перекрывает более общее.

```text
Company default
-> Department policy
-> Seat / Position policy
-> Level policy
-> Employee override
```

Пример:

```text
Sales Department default:
- Marketing Lead bonus: 7%
- Cold Call bonus: 10%

Seller Middle override:
- Marketing Lead bonus: 5%

Employee Anna override:
- Marketing Lead bonus: 4%
```

Для Anna применяется 4%, потому что employee override самый конкретный.

Правило: любое override должно иметь reason, effective date и audit.

---

## Compensation Profile / Профиль оплаты

`Compensation Profile` - версия условий оплаты сотрудника.

Профиль не редактируется как один вечный record. Если условия изменились, создаётся новая версия.

### Обязательные поля

| Поле                     | Описание                             |
| ------------------------ | ------------------------------------ |
| `employee_id`            | Сотрудник                            |
| `base_salary`            | Минимальная / фиксированная зарплата |
| `currency`               | AMD / USD / EUR                      |
| `payout_schedule`        | График выплаты                       |
| `active_bonus_policy_id` | Активное правило бонусов             |
| `active_kpi_policy_id`   | Активное правило KPI, если есть      |
| `effective_from`         | С какой даты действует               |
| `status`                 | Draft / Active / Archived            |

### Дополнительные поля

| Поле             | Описание                                          |
| ---------------- | ------------------------------------------------- |
| `effective_to`   | Когда профиль перестал действовать                |
| `notes`          | Комментарий CEO/HR/Finance                        |
| `approved_by_id` | Кто утвердил                                      |
| `approved_at`    | Когда утвердил                                    |
| `source`         | Manual / onboarding / promotion / contract update |

### Lifecycle

```text
Draft -> Review -> Active -> Archived
```

Правила:

- активным может быть только один compensation profile на дату;
- старый профиль не удаляется, а архивируется;
- Finance использует профиль, который был активен в расчётном периоде payroll;
- изменения задним числом требуют correction / adjustment.

---

## Bonus Policy / Правила бонусов

`Bonus Policy` описывает, как создаются и считаются бонусы.

Это универсальная система для всех ролей, не только для Seller.

### Типы Bonus Policy

| Тип                    | Для кого / чего                        |
| ---------------------- | -------------------------------------- |
| `Sales Bonus`          | Seller / Head of Sales                 |
| `Delivery Bonus`       | Developer / PM / Designer / QA         |
| `Marketing Bonus`      | Marketing roles                        |
| `Support Bonus`        | Support / Maintenance roles            |
| `Manual Bonus`         | Разовое решение CEO/Finance            |
| `Project Bonus Pool`   | Плановый фонд бонусов по проекту       |
| `Subscription Release` | Выпуск бонусов по подписочным проектам |

### Что можно настраивать

| Параметр              | Пример                                              |
| --------------------- | --------------------------------------------------- |
| `rate`                | 7%, 10%, fixed amount                               |
| `source_filter`       | Marketing Lead, Cold Call, Partner, Existing Client |
| `deal_type_filter`    | Product, Extension, Maintenance, Outsource          |
| `payment_type_filter` | Classic, Subscription, Custom                       |
| `product_category`    | Website, Mobile, CRM, Design                        |
| `product_type`        | White Label, Mix, Custom Code                       |
| `role_filter`         | Developer, PM, Designer, Seller                     |
| `level_filter`        | Junior, Middle, Senior, Lead                        |
| `kpi_gate_policy`     | Как KPI влияет на выплату                           |
| `cap_policy`          | Максимум бонуса за период                           |
| `holdback_policy`     | Удержание части бонуса                              |
| `release_policy`      | Когда бонус становится доступен к payroll           |

### Sales example

```text
Marketing Lead -> 7%
Cold Call -> 10%
Existing Client -> 5%
Partner Referral -> 5%
```

Это стартовый шаблон. В будущем ставка может быть своя у каждого seller.

### Delivery example

```text
Product Type: White Label -> 7%
Product Type: Mix -> 10%
Product Type: Custom Code -> 15%
```

Это тоже шаблон. Для конкретного сотрудника или проекта CEO может задать override.

---

## KPI Policy / Правила KPI

`KPI Policy` описывает, какие KPI применяются и как они влияют на бонусы.

### Состав KPI Policy

| Поле               | Описание                                       |
| ------------------ | ---------------------------------------------- |
| `scope`            | Company / Department / Seat / Level / Employee |
| `metrics`          | Список KPI metrics                             |
| `weights`          | Веса метрик                                    |
| `period`           | Week / Month / Quarter / Sprint                |
| `target_source`    | Manual / automatic from module                 |
| `result_source`    | Manual / CRM / Finance / Tasks / Support       |
| `gate_rules`       | Пороги выплаты                                 |
| `locked_part_rule` | Forfeit / Carry Forward / Manual Review        |

### KPI Gate example

```text
KPI Score >= 70%  -> 100% bonus available
KPI Score 50-69%  -> 50% bonus available
KPI Score < 50%   -> 0% bonus available
```

Пороги должны быть настройкой policy, а не жёстким кодом.

---

## Policy Templates / Шаблоны правил

`Policy Template` - безопасный шаблон логики, созданный в коде.

Админка не должна быть свободным конструктором любой логики. CEO/HR/Finance выбирают template и настраивают параметры.

Примеры templates:

| Template                              | Параметры в UI                                   |
| ------------------------------------- | ------------------------------------------------ |
| `Sales percentage by lead source`     | source -> percent                                |
| `Delivery percentage by product type` | product type -> percent                          |
| `KPI gate payout multiplier`          | thresholds -> payout percent                     |
| `Subscription delivery release`       | after project done, release by available funding |
| `Manual bonus with approval`          | amount, reason, approver                         |
| `Holdback after delivery`             | holdback percent, release days                   |

Код отвечает за безопасность и порядок расчёта. UI отвечает за параметры.

---

## Screens / Экраны

### Compensation dashboard

Главный экран раздела показывает:

- active compensation profiles;
- employees without active profile;
- upcoming profile changes;
- policies expiring soon;
- employees with overrides;
- payroll risk warnings.

### Compensation Profiles view

Таблица:

```text
Employee | Department | Seat | Base Salary | Bonus Policy | KPI Policy | Effective From | Status
```

Действия:

- create profile;
- clone profile;
- schedule change;
- archive old profile;
- open employee wallet;
- view audit.

### Bonus Policies view

Таблица:

```text
Policy | Scope | Applies To | Template | Effective From | Status | Overrides
```

Фильтры:

- department;
- seat;
- level;
- employee;
- policy type;
- active / archived.

### KPI Policies view

Таблица:

```text
Policy | Scope | Metrics | Period | Gate | Effective From | Status
```

Действия:

- create from template;
- edit thresholds;
- assign to seat / employee;
- preview impact on bonus;
- archive.

### Employee policy drawer

Из карточки сотрудника должен открываться drawer:

- active compensation profile;
- active bonus policy;
- active KPI policy;
- overrides;
- effective history;
- upcoming changes;
- audit.

---

## Workflow / Процессы

### New employee

```text
Create Employee
-> assign primary seat
-> create compensation profile draft
-> select bonus policy
-> select KPI policy
-> approve profile
-> profile becomes active from hire date
```

### Promotion / повышение

```text
Change seat or level
-> system suggests new default policies
-> HR/CEO reviews compensation profile
-> new profile version starts from effective date
-> old profile archived
```

### Individual agreement / персональная договорённость

```text
Open employee
-> create employee override
-> choose bonus/KPI parameter
-> add reason
-> approve
-> override applies from effective date
```

### Policy change for department

```text
Open Bonus Policy
-> change department rule
-> preview affected employees
-> choose effective date
-> approve
-> new policy version created
```

---

## Validation rules / Защиты

Система должна предупреждать:

- employee has no active compensation profile;
- active profile has no base salary;
- active profile has no bonus policy when role requires it;
- KPI policy weights do not sum to 100%;
- employee override has no reason;
- effective dates overlap;
- policy change affects payroll already approved;
- policy references archived seat or department.

Payroll не должен запускаться без active compensation profile для сотрудника, который входит в расчёт.

---

## Access / Доступы

| Роль             | Доступ                                                                |
| ---------------- | --------------------------------------------------------------------- |
| CEO              | Полный доступ ко всем profiles, policies, overrides, audit            |
| HR               | Создание профилей, seats, onboarding data; salary видимость по правам |
| Finance Director | Видит и использует compensation для payroll; может готовить changes   |
| Head of Dept     | Видит policies своего отдела и KPI; не видит зарплаты без разрешения  |
| Employee         | Видит только свой wallet и краткое описание своих условий             |

Изменение money-related условий требует approval CEO или роли с явным правом.

---

## Связи с Finance

```text
Compensation Profile
-> Payroll Run

Bonus Policy
-> Bonus Entry / Project Bonus Pool / Bonus Release

KPI Policy
-> KPI Result
-> KPI Gate
-> Payable Bonus
-> Payroll Run
```

Finance не должен хранить собственные версии правил мотивации. Он берёт активные rules из My Company и делает расчёт.

---

## Связанные документы

- [00-My-Company-Overview.md](./00-My-Company-Overview.md) - общий канон My Company.
- [02-Team-Employees.md](./02-Team-Employees.md) - карточка сотрудника и compensation секция.
- [04-KPI-Scorecard.md](./04-KPI-Scorecard.md) - KPI и scorecard.
- [../04-Finance/05-Bonus-and-Payroll.md](../04-Finance/05-Bonus-and-Payroll.md) - payroll и выпуск бонусов.
