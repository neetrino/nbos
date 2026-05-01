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

Classic payout не использует накопительную subscription payout_rule. Даже если сумма маленькая, партнёру платим за этот проект после сдачи и полной оплаты.

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

| Решение                                                                     | Статус   |
| --------------------------------------------------------------------------- | -------- |
| Partner Accrual создаётся только от реально полученных денег                | Accepted |
| Classic payout платится после сдачи и полной оплаты                         | Accepted |
| Subscription payout использует payout_rule на уровне subscription / project | Accepted |
| Partner Balance нужен для контроля unpaid accruals                          | Accepted |
| Payout Batch объединяет несколько accruals в одну выплату                   | Accepted |
| Expense Card является payment layer, а не source of truth по начислениям    | Accepted |
