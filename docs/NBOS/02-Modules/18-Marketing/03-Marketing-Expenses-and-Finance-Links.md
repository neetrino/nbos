# Marketing Expenses and Finance Links

> NBOS Marketing - как маркетинговые бюджеты и аккаунты связываются с Finance.

## Назначение

Marketing должен видеть, сколько стоит активность или аккаунт, но Finance остаётся владельцем оплаты.

Главный принцип:

```text
Marketing requests/links spend.
Finance pays and controls expense lifecycle.
Marketing uses paid/planned spend for analytics.
```

## Two spend models

### 1. Campaign spend

Разовый или ограниченный запуск.

Примеры:

- Instagram ad for 7 days;
- Facebook campaign;
- SMM promo;
- landing page promotion.

Процесс:

```text
Marketing Activity launched
  -> budget entered
  -> Expense Card created/proposed
  -> Finance pays
  -> actual spend becomes available for Marketing analytics
```

### 2. Account recurring spend

Постоянный расход на account.

Пример:

```text
List.am Account 1
  paid weekly
  linked to Finance Expense Plan
```

Процесс:

```text
Marketing Account
  -> linked Finance Expense Plan
    -> recurring Expense Cards
      -> paid by Finance
        -> spend attributed back to Marketing Account
```

## Expense Card creation from Marketing

When marketer launches paid activity:

Required:

- budget amount;
- currency;
- start date;
- end date;
- expected payment date;
- channel;
- activity link.

NBOS creates:

```text
Finance Expense Card
  category = Marketing
  source = Marketing Activity
  amount = budget
  expected payment date
  status = Planned / Upcoming
```

Finance can edit/payment-control the expense according to Finance rules.

## Expected payment date

For Meta/Facebook/Instagram:

```text
default expected payment date = end date or end date + configured delay
```

Marketer can override it if needed.

## Actual spend

Analytics should prefer:

```text
Paid amount from Finance
```

If not paid yet, use:

```text
Planned budget
```

But mark it visually:

- `Planned spend`;
- `Paid spend`;
- `Missing spend`.

## List.am expense plan link

For List.am, account-level expense is better than campaign-level expense.

Fields:

- marketing account;
- linked finance expense plan;
- recurrence;
- expected weekly/monthly cost;
- actual paid spend by period.

This allows:

```text
List.am Account spend / leads / won deals / revenue
```

## Cost metrics

Only calculate cost metrics when spend exists.

```text
CPL = Spend / Leads
Cost per SQL = Spend / SQL
CAC = Spend / Won Clients
ROI = Revenue / Spend
```

If spend is missing:

```text
Show leads/revenue metrics.
Hide or mark CPL/ROI as "No spend data".
```

## Finance boundary

Marketing cannot mark expense as paid.

Finance owns:

- payment status;
- partial payment;
- expense backlog/on hold;
- actual paid date;
- paid amount;
- finance approval.

Marketing sees linked status and uses it for analytics.

## Cleanup and validation

Marketing should show warnings:

- launched paid activity without expense card;
- marketing account without linked expense plan;
- expense linked to wrong channel/account;
- spend exists but no leads attributed;
- leads exist but no spend tracking.
