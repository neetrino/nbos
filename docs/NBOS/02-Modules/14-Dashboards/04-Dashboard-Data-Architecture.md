# Dashboard Data Architecture

> NBOS Dashboard - как собирать данные быстро, безопасно и без дублирования бизнес-логики.

## Principle

Dashboard не является владельцем бизнес-данных.

Он строит projections из других модулей:

```text
CRM -> Dashboard projections
Finance -> Dashboard projections
Projects Hub -> Dashboard projections
Tasks -> Dashboard projections
Support -> Dashboard projections
Calendar -> Dashboard projections
Notifications -> Priority Feed
My Company -> role/default layout
Settings -> feature flags/module settings
```

## Dashboard Projection

Каждый модуль может публиковать лёгкие projection endpoints/cards.

Пример:

```text
FinanceDashboardProjection
  overdue_invoices_count
  overdue_amount
  due_today_count
  payroll_approval_required
```

Dashboard не должен сам заново вычислять всю finance logic.

## Priority Feed source

Priority Feed собирается из:

- Notifications engine;
- Scheduler events;
- module-level blockers;
- approval requests;
- required confirmations;
- entity risk projections.

## Loading strategy

```text
1. Load dashboard shell
2. Load user preferences
3. Render pinned actions
4. Load priority feed
5. Lazy-load widgets
6. Load mini analytics last
```

Если один модуль недоступен, Dashboard не должен падать целиком.

## Cache strategy

| Data type       | Refresh                                          |
| --------------- | ------------------------------------------------ |
| pinned actions  | user preference cache                            |
| priority feed   | near real-time / short polling / websocket later |
| small widgets   | 30-120 seconds or event-driven                   |
| heavy analytics | not on Dashboard                                 |

## Real-time updates

В будущем Dashboard может получать live updates:

- new urgent notification;
- invoice paid;
- task assigned;
- ticket escalated;
- on-hold pause expired;
- meeting reminder.

Но MVP может работать через periodic refresh и manual refresh.

## Security

Dashboard API должен применять:

- RBAC;
- scope;
- entity ownership;
- department access;
- finance sensitivity;
- credentials sensitivity.

Нельзя отдавать в Dashboard больше данных, чем пользователь может увидеть в исходном модуле.

## Widget registration

Каждый модуль регистрирует widgets/actions через декларативный список.

```text
module: finance
actions:
  - open_invoices
  - open_salary_board
widgets:
  - overdue_invoices
  - payroll_pending
```

Это позволит в будущем добавлять новые кнопки и виджеты без переписывания всего Dashboard.

## Analytics boundary

Dashboard показывает только operational summary.

Analytics/Reports использует отдельные запросы, кэш и расчёты:

- long ranges;
- charts;
- exports;
- scheduled reports;
- comparisons;
- cohort analysis.
