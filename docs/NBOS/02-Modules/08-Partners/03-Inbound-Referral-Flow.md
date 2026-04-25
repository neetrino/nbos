# Inbound Referral Flow

## Назначение

Inbound flow описывает партнёров, которые приводят клиентов Neetrino.

```
Partner -> Lead / Deal -> Order / Subscription -> Client Payment -> Partner Accrual
```

---

## 1. CRM entry

Lead или Deal может иметь source = Partner.

Обязательные поля:

- `source = Partner`;
- `sourcePartnerId`;
- marketing/source поля CRM;
- Deal Type;
- Payment Type;
- Partner Referral Terms.

Если source = Partner, но партнёр не выбран, переход дальше должен быть заблокирован stage-gate popup.

---

## 2. Deal Type and Payment Type

В inbound flow эти два поля имеют разные обязанности:

| Поле         | Влияет на             |
| ------------ | --------------------- |
| Deal Type    | Процент партнёра      |
| Payment Type | Ритм выплаты партнёру |

### Deal Type

Deal Type берёт процент из Partner Commission Policy.

### Payment Type

Classic:

- партнёр получает выплату после сдачи проекта и полной оплаты проекта клиентом;
- payout rule не нужен для накопления.

Subscription:

- партнёр получает начисления после каждого реально полученного subscription-платежа;
- payout rule задаётся на уровне конкретной subscription / project связи.

---

## 3. Classic flow

```
Deal source = Partner
  -> Deal Won
  -> Order created
  -> Project delivered
  -> All project money received
  -> Partner Accrual created
  -> Payout / Expense
```

Правила:

- партнёрский accrual не создаётся при Deal Won;
- accrual создаётся только после полной оплаты и сдачи проекта;
- если есть тестовый / waiting period, он фиксируется в payout rules проекта;
- после eligibility Finance может создать payout batch / expense.

---

## 4. Subscription flow

```
Deal source = Partner
  -> Deal Won
  -> Subscription created
  -> Project delivered / subscription active
  -> Monthly invoice paid
  -> Partner Accrual created
  -> Partner Balance updated
  -> payout_rule decides batch/payment timing
```

Правила:

- начисление создаётся только от реально полученного платежа;
- если клиент не оплатил месяц, партнёру за этот месяц ничего не начисляется;
- payout_rule относится к конкретной subscription-связи, а не глобально ко всему партнёру;
- маленькие суммы могут копиться на балансе по этой subscription.

---

## 5. Examples

### Product + Classic

- Deal Type = Product.
- Partner Percent = 30%.
- Payment Type = Classic.
- Client paid full project amount after delivery.
- Partner gets one payout for Product after all conditions are met.

### Product + Subscription

- Deal Type = Product.
- Partner Percent = 30%.
- Payment Type = Subscription.
- Client pays monthly.
- Partner accrual is created after each paid monthly invoice.
- payout_rule decides whether to pay monthly or accumulate.

### Maintenance + Subscription

- Deal Type = Maintenance.
- Partner Percent = 20%.
- Payment Type = Subscription.
- Partner gets 20% from received maintenance subscription payments according to payout_rule.

---

## 6. Handoff to Finance

Inbound flow не создаёт Expense напрямую.

Правильная цепочка:

```
Client Payment Received
  -> Partner Accrual
  -> Partner Balance
  -> Payout Batch
  -> Expense Card
  -> Paid
```

Expense Card — это факт платежа партнёру. Partner Accrual — это причина и расчёт.

---

## 7. Accepted decisions

| Решение                                                               | Статус   |
| --------------------------------------------------------------------- | -------- |
| Partner source обязателен при source = Partner                        | Accepted |
| Classic partner payout после сдачи и полной оплаты                    | Accepted |
| Subscription partner payout после каждого реально полученного платежа | Accepted |
| Subscription payout_rule задаётся на уровне subscription / project    | Accepted |
| Expense не создаётся без Partner Accrual / Balance логики             | Accepted |
