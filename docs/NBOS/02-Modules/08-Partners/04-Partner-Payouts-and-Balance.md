# Partner Payouts and Balance

## Назначение

Этот документ описывает, как Neetrino начисляет деньги партнёру, копит невыплаченные суммы и выплачивает их через Finance.

Главное правило: партнёру начисляются деньги только из реально полученных Neetrino денег.

---

## 1. Основные понятия

| Понятие         | Смысл                                                       |
| --------------- | ----------------------------------------------------------- |
| Partner Accrual | Конкретное начисление партнёру из client payment            |
| Partner Balance | Невыплаченная сумма партнёра                                |
| Payout Rule     | Правило, когда subscription accruals объединяются в выплату |
| Payout Batch    | Пачка accruals, выбранная к выплате                         |
| Expense Card    | Фактическая исходящая оплата партнёру                       |

---

## 2. Partner Accrual

Accrual хранит:

| Поле                             | Назначение                                       |
| -------------------------------- | ------------------------------------------------ |
| partner                          | Партнёр                                          |
| project / product / subscription | За что начислено                                 |
| source_payment                   | Платёж клиента, от которого начислено            |
| deal_type                        | Deal Type для процента                           |
| payment_type                     | Classic / Subscription                           |
| percent                          | Зафиксированный процент                          |
| base_amount                      | Полученная сумма, от которой считаем             |
| accrual_amount                   | Сумма партнёру                                   |
| status                           | Accrued / Eligible / In Batch / Paid / Cancelled |

---

## 3. Classic payout

Для `Payment Type = Classic` payout работает просто:

```
Project delivered
  + Full client payment received
  -> Partner Accrual
  -> Eligible
  -> Payout Batch / Expense
  -> Paid
```

Classic payout не использует накопительную subscription payout_rule. Даже если сумма маленькая, партнёру платим за этот проект после сдачи и полной оплаты. Полная оплата Classic — сумма платежей по **order-linked** invoice ≥ `Order.totalAmount` (весь контракт), а не факт, что все уже выставленные счета оплачены. Депозит без остатка полной оплатой не считается.

Если бизнес хочет задержать выплату по конкретному classic case, это manual hold с причиной и audit log.

---

## 4. Subscription payout

Для `Payment Type = Subscription` accrual создаётся после каждого оплаченного subscription invoice.

```
Subscription invoice paid
  -> Partner Accrual
  -> Partner Balance
  -> payout_rule for this subscription
  -> Payout Batch
  -> Expense Card
```

Начисление по-прежнему одна строка на реально полученный платёж. Меняется только начальный статус:

- `DEV_ONLY` и `DEV_AND_MAINTENANCE` — если связанный product/extension ещё не сдан, accrual создаётся как `ACCRUED` (`eligibleAt` пустой) и не попадает в payout batch. После сдачи (`DONE` через complete, updateStatus или любой другой переход в DONE) статус меняется на `ELIGIBLE`. Журнал при release не пишется: обязательство уже учтено в момент платежа.
- Если носитель закрывается как `LOST` (cancel или status → LOST), held-строки того order (`ACCRUED` + `subscriptionId` не null) становятся `CANCELLED`. `ELIGIBLE` / `IN_BATCH` / `PAID` не трогаем — обещанные или выплаченные деньги только вручную. Повторный cancel — no-op (`updateMany`). Журнальная строка `PARTNER_ACCRUAL` реверсится через тот же `reverseJournalLineByIdempotencyKey`, что invoice/expense cancel (`status: REVERSED`).
- `MAINTENANCE_ONLY` и `PARTNER_SERVICE` — сразу `ELIGIBLE`: у них нет milestone сдачи.
- Если у order нет ни `productId`, ни `extensionId`, держать нельзя (нечему стать DONE) — создаём `ELIGIBLE`.

`payout_rule` применяется только к уже `ELIGIBLE` начислениям и не заменяет этот delivery gate.

### Payout Rule

`payout_rule` задаётся на уровне конкретной partner subscription / project связи.

Варианты:

| Rule       | Смысл                                         |
| ---------- | --------------------------------------------- |
| Monthly    | Выплачивать доступные accruals каждый месяц   |
| Quarterly  | Выплачивать раз в 3 месяца                    |
| Semiannual | Выплачивать раз в 6 месяцев                   |
| Manual     | Finance сам формирует payout batch            |
| Threshold  | Выплачивать, когда накопилась указанная сумма |

`minimum_payout_amount` используется только для `Threshold`.

Пример:

- Partner X по Project A получает subscription accruals каждый месяц.
- Partner X по Project B просит копить маленькие суммы и платить раз в 6 месяцев.
- Поэтому payout_rule хранится не глобально на партнёре, а на конкретной subscription-связи.

---

## 5. Partner Balance

Partner Balance показывает:

- сколько начислено;
- сколько eligible;
- сколько уже в payout batch;
- сколько оплачено;
- сколько осталось unpaid.

Balance должен быть виден:

- по партнёру в целом;
- по проекту / продукту;
- по subscription-связи;
- по периоду.

---

## 6. Payout Batch

Payout Batch — это пачка начислений, которую Finance собирается выплатить одним переводом.

Поля:

| Поле         | Назначение                                            |
| ------------ | ----------------------------------------------------- |
| partner      | Кому платим                                           |
| accruals     | Какие начисления вошли                                |
| total_amount | Общая сумма                                           |
| status       | Draft / Approved / Expense Created / Paid / Cancelled |
| payout_date  | Плановая или фактическая дата выплаты                 |
| expense_card | Связанный Expense Card                                |

После approval создаётся Expense Card category = Partner Payout.

---

## 7. Expense Card

Expense Card не рассчитывает партнёрскую логику. Она только фиксирует фактическую оплату.

```
Payout Batch Approved
  -> Expense Card Created
  -> Finance pays
  -> Expense Paid
  -> Payout Batch Paid
  -> Accruals Paid
```

---

## 8. Accepted decisions

| Решение                                                                                      | Статус   |
| -------------------------------------------------------------------------------------------- | -------- |
| Partner Accrual создаётся только от реально полученных денег                                 | Accepted |
| Classic payout платится после сдачи и полной оплаты (полученная сумма ≥ `Order.totalAmount`) | Accepted |
| Subscription payout использует payout_rule на уровне subscription / project                  | Accepted |
| DEV-подписки: accrual `ACCRUED` до сдачи, затем `ELIGIBLE`                                   | Accepted |
| Held DEV-accrual: `LOST` носителя → `CANCELLED` + reverse journal                            | Accepted |
| Partner Balance нужен для контроля unpaid accruals                                           | Accepted |
| Payout Batch объединяет несколько accruals в одну выплату                                    | Accepted |
| Expense Card является payment layer, а не source of truth по начислениям                     | Accepted |
