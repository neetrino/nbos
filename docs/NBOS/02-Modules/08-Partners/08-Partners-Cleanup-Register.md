# Partners Cleanup Register

> NBOS Platform — runtime gaps, stale-логика и задачи зачистки по модулю Partners.

## 1. Current runtime status

Сейчас runtime реализует только базовую часть:

- `Partner` model есть;
- `Lead.sourcePartnerId` есть;
- `Deal.sourcePartnerId` есть;
- `Order.partnerId` есть;
- `Subscription.partnerId` есть;
- API Partners поддерживает CRUD;
- UI Partners показывает простую таблицу.

---

## 2. Runtime gaps

### P1. UI Partners не совпадает с API

UI ожидает поля:

- `companyName`;
- `level`;
- `agreementStatus`;
- `defaultPercentage`;
- `dealsCount`;
- `totalRevenue`;
- `outstanding`.

API / DB сейчас имеют:

- `name`;
- `type`;
- `direction`;
- `defaultPercent`;
- `status`;
- `_count.orders`;
- `_count.subscriptions`.

Нужно привести UI/API к новому канону.

### P2. Нет Commission Policy по Deal Type

Сейчас есть только `defaultPercent`.

Нужно добавить Partner Commission Policy:

- Product percent;
- Extension percent;
- Maintenance percent;
- Outsource percent;
- fallback default percent.

### P3. Нет Partner Referral Terms

Сейчас partner source хранится на Lead / Deal, но условия процента не фиксируются отдельно.

Нужно фиксировать percent на момент сделки, чтобы будущие изменения policy не меняли старые deals.

### P4. Нет Partner Accrual / Balance / Payout Batch

Сейчас docs раньше предлагали сразу Expense.

Новый канон:

```
Client Payment -> Partner Accrual -> Partner Balance -> Payout Batch -> Expense Card -> Paid
```

Нужно реализовать отдельный слой начислений.

### P5. Subscription payout_rule должен быть на уровне subscription / project

Нельзя хранить payout_rule только глобально на Partner.

У одного партнёра разные проекты могут иметь разные правила выплаты subscription accruals.

### P6. Classic payout не должен использовать subscription payout_rule

Classic payout:

- проект сдан;
- все деньги получены;
- создаётся accrual;
- платим партнёру за проект.

Если нужна задержка, это manual hold с reason.

### P7. Outbound flow не отделён от inbound

Outbound — это доход Neetrino от партнёра.

Нужно:

- хранить Partner Service Terms;
- создавать Invoice / Subscription в Finance;
- показывать revenue в Partners.

### P8. Partner Account v2 не заложен в data visibility

Нужно проектировать Partner Accrual / Balance так, чтобы позже безопасно показать партнёру read-only данные.

---

## 3. Documentation cleanup

Старый `01-Partners-Overview.md` был одним большим смешанным документом и заменён новой структурой:

- `00-Partners-Overview.md`;
- `01-Partner-Directory-and-Settings.md`;
- `02-Partner-Commission-Policy.md`;
- `03-Inbound-Referral-Flow.md`;
- `04-Partner-Payouts-and-Balance.md`;
- `05-Outbound-Partner-Services.md`;
- `06-Partner-Account-Portal-v2.md`;
- `07-Partner-Analytics-and-Agreements.md`;
- `08-Partners-Cleanup-Register.md`.

Нужно обновить ссылки из соседних документов, которые всё ещё ссылаются на старый `01-Partners-Overview.md`.

---

## 4. Implementation checklist

### Models

- Partner Commission Policy.
- Partner Referral Terms.
- Partner Accrual.
- Partner Balance computed view.
- Payout Batch.
- Partner Service Terms for outbound.
- Agreement metadata.

### API

- Partner CRUD aligned with UI.
- Commission policy endpoints.
- Accrual list / balance endpoints.
- Payout batch create / approve / paid endpoints.
- Partner portfolio / analytics endpoints.
- Outbound Partner Service endpoints.

### UI

- Partner Card with tabs.
- Commission Policy tab.
- Inbound Referrals tab.
- Payouts & Balance tab.
- Outbound Services tab.
- Agreements tab.
- Analytics tab.

### Automation

- CRM source Partner stage-gates.
- Partner percent fixed on Deal / Order / Subscription.
- Accrual creation after real payment.
- Subscription payout_rule scheduler.
- Payout batch -> Expense Card.
- Notifications for payout and agreement expiration.

---

## 5. Accepted decisions

| Решение                                                   | Статус   |
| --------------------------------------------------------- | -------- |
| Старый Partners overview заменён модульной структурой     | Accepted |
| Runtime currently PARTIAL                                 | Accepted |
| defaultPercent alone is not enough                        | Accepted |
| Need Partner Accrual / Balance / Batch before Expense     | Accepted |
| Need outbound revenue model separated from inbound payout | Accepted |
