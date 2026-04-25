# Partners — Обзор модуля

## Назначение

`Partners` управляет партнёрскими отношениями NBOS: кто приводит клиентов Neetrino, кому Neetrino платит партнёрский процент, кому Neetrino передаёт клиентов, и какие деньги связаны с этими отношениями.

Главное правило: Partners не является просто справочником. Это модуль контроля партнёрских условий, начислений, выплат, исходящих партнёрских услуг и аналитики.

---

## 1. Две стороны партнёрства

### Inbound Partner

Партнёр приводит клиента Neetrino.

```
Partner -> Lead / Deal -> Neetrino project -> Client payment -> Partner accrual -> Partner payout
```

Деньги идут так:

- клиент платит Neetrino;
- Neetrino начисляет партнёрский процент;
- Neetrino выплачивает партнёру.

### Outbound Partner

Neetrino передаёт клиента партнёру.

```
Client request -> Neetrino refers to Partner -> Partner pays Neetrino -> Partner Service revenue
```

Деньги идут так:

- партнёр оказывает услугу клиенту;
- партнёр платит Neetrino фиксированную сумму или регулярную оплату;
- доход учитывается через Finance Invoice / Subscription.

---

## 2. Главные сущности

| Сущность                    | Назначение                                                                |
| --------------------------- | ------------------------------------------------------------------------- |
| `Partner`                   | Партнёрская организация или человек с условиями сотрудничества            |
| `Partner Commission Policy` | Проценты партнёра по Deal Type                                            |
| `Partner Referral Terms`    | Зафиксированные условия партнёра на конкретной сделке / заказе / подписке |
| `Partner Accrual`           | Конкретное начисление партнёру из реально полученных денег                |
| `Partner Balance`           | Невыплаченные начисления партнёра, доступные к выплате                    |
| `Payout Batch`              | Пачка начислений, которую Finance выплачивает одним переводом             |
| `Expense Card`              | Фактическая исходящая оплата партнёру в Finance                           |
| `Partner Service Revenue`   | Доход Neetrino от outbound-партнёра                                       |
| `Partner Account`           | Будущий read-only портал партнёра                                         |

---

## 3. Главный финансовый канон

### Deal Type влияет на процент

Процент партнёра зависит только от `Deal Type`.

Пример:

| Deal Type   | Percent |
| ----------- | ------- |
| Product     | 30%     |
| Extension   | 30%     |
| Maintenance | 20%     |
| Outsource   | 10%     |

### Payment Type влияет на способ выплаты

`Payment Type` не меняет процент. Он определяет, как и когда партнёру выплачивать начисления.

| Payment Type | Как платим партнёру                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Classic      | После сдачи проекта и получения полной оплаты по проекту                                             |
| Subscription | После каждого реально полученного subscription-платежа, по payout rule конкретной subscription-связи |

---

## 4. Inbound цепочка

```
Partner
  -> Lead / Deal source = Partner
  -> Partner Referral Terms фиксируются на Deal / Order / Subscription
  -> Client Payment Received
  -> Partner Accrual
  -> Partner Balance
  -> Payout Batch
  -> Expense Card
  -> Paid
```

Начисление партнёру никогда не создаётся от плановой суммы. Только от реально полученных денег.

---

## 5. Outbound цепочка

```
Client asks for service Neetrino does not provide
  -> Neetrino refers client to Partner
  -> Partner Service Terms фиксируются
  -> Finance creates Invoice / Subscription to Partner
  -> Partner pays Neetrino
  -> Partners shows Partner Service Revenue
```

Outbound-партнёрство — это доход Neetrino, а не payout.

---

## 6. Связи с другими модулями

| Модуль                | Связь                                                              |
| --------------------- | ------------------------------------------------------------------ |
| CRM                   | Lead / Deal source Partner, фиксация партнёрских условий           |
| Clients               | Contact с типом Partner, клиентская история по переданным клиентам |
| Projects Hub          | Project / Product показывают partner referral context              |
| Finance Invoices      | Доход от клиента или партнёра                                      |
| Finance Subscriptions | Subscription-платежи клиента или outbound partner service          |
| Finance Expenses      | Expense Card создаётся для фактической выплаты партнёру            |
| P&L Reports           | Partner payouts как расходы, partner service revenue как доход     |
| Drive                 | Хранение соглашений, договоров и документов партнёра               |
| Notifications         | Напоминания о payout, истечении договора, новых referral leads     |

---

## 7. Структура документов

- `01-Partner-Directory-and-Settings.md` — карточка партнёра и настройки.
- `02-Partner-Commission-Policy.md` — проценты по Deal Type.
- `03-Inbound-Referral-Flow.md` — входящие партнёрские сделки.
- `04-Partner-Payouts-and-Balance.md` — начисления, баланс, batch-выплаты.
- `05-Outbound-Partner-Services.md` — клиенты, которых Neetrino передаёт партнёрам.
- `06-Partner-Account-Portal-v2.md` — будущий read-only портал партнёра.
- `07-Partner-Analytics-and-Agreements.md` — аналитика и договоры.
- `08-Partners-Cleanup-Register.md` — runtime gaps и stale-логика.

---

## 8. Accepted decisions

| Решение                                                                             | Статус   |
| ----------------------------------------------------------------------------------- | -------- |
| Inbound и Outbound — разные денежные процессы                                       | Accepted |
| Deal Type определяет процент партнёра                                               | Accepted |
| Payment Type определяет ритм выплаты партнёру                                       | Accepted |
| Subscription payout rule задаётся на уровне конкретной subscription / project связи | Accepted |
| Classic payout платится после сдачи проекта и полной оплаты                         | Accepted |
| Partner Balance является центральной моделью для невыплаченных начислений           | Accepted |
| Expense Card создаётся только для фактической выплаты, не вместо Partner Accrual    | Accepted |
| Partner Account закладывается как v2 read-only portal                               | Accepted |
