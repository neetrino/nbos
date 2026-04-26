# Priority Feed and Widgets

> NBOS Dashboard - рабочие карточки, важные уведомления, role widgets и action-first логика.

## Priority Feed

`Priority Feed` - это не обычный notification list.

Он показывает только то, что требует внимания или решения.

Примеры:

- invoice overdue;
- invoice reminder failed;
- deal cannot move to target stage;
- deal won blocked by unpaid invoice;
- product deadline risk;
- extension deadline risk;
- on-hold pause expired;
- task waiting review;
- support ticket SLA risk;
- credential access review due;
- payroll run needs approval;
- partner payout ready;
- company announcement needs confirmation.

## Priority levels

| Level      | Meaning                  |
| ---------- | ------------------------ |
| `Critical` | Нужно действовать сейчас |
| `High`     | Нужно решить сегодня     |
| `Normal`   | Важно, но не блокирует   |
| `Info`     | Информационная карточка  |

## Card anatomy

```text
Priority Card
  title
  short context
  source module
  linked entity
  severity
  due date / age
  primary action
  secondary action
```

Пример:

```text
Invoice overdue: Marco.am - 150,000 AMD
Source: Finance
Action: Open Invoice
Secondary: Send Reminder
```

## Announcements and confirmations

Важные объявления могут требовать подтверждения.

Примеры:

- новая политика безопасности;
- изменение процесса CRM;
- incident update;
- важное сообщение CEO;
- релиз с обязательным ознакомлением.

Если confirmation required, карточка остаётся в feed до подтверждения.

## Role widgets

Виджеты должны быть маленькими рабочими блоками, а не большими отчётами.

### Seller widgets

- My open deals;
- Offers pending;
- Deposits expected;
- Stage blockers;
- Seller KPI short summary.

### PM / Delivery widgets

- Products at risk;
- QA waiting;
- Transfer waiting;
- On hold expired;
- Tasks waiting review.

### Finance widgets

- Invoices due/overdue;
- Subscription billing issues;
- Expenses due;
- Payroll approvals;
- Partner payouts.

### Owner widgets

- Company focus;
- Finance risks;
- Delivery risks;
- Sales blockers;
- Important approvals.

### Developer widgets

- My tasks;
- Tasks blocked;
- Review requests;
- Active Work Spaces;
- Unread task threads.

## Widget rules

Каждый widget должен иметь:

- clear owner module;
- permission requirement;
- loading state;
- empty state;
- error state;
- link to source module;
- refresh policy.

## What does not belong in Dashboard widgets

Не нужно грузить на Dashboard:

- большие графики за год;
- full P&L;
- full MRR report;
- full sales funnel analytics;
- raw tables на сотни строк;
- storage cleanup details;
- logs/audit timelines.

Это всё живёт в Analytics, Reports или конкретном модуле.
