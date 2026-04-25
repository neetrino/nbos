# Outbound Partner Services

## Назначение

Outbound Partner Services описывает случаи, когда Neetrino передаёт клиента партнёру, а партнёр платит Neetrino за переданного клиента или регулярную услугу.

Это доход Neetrino, а не выплата партнёру.

---

## 1. Процесс

```
Client requests service
  -> Neetrino does not provide / chooses partner
  -> Partner receives client
  -> Partner Service Terms fixed
  -> Finance creates Invoice / Subscription to Partner
  -> Partner pays Neetrino
  -> Partners shows revenue history
```

---

## 2. Что фиксируем

Для outbound case нужно хранить:

| Поле                       | Назначение                                         |
| -------------------------- | -------------------------------------------------- |
| partner                    | Партнёр, которому передали клиента                 |
| client / contact / company | Клиент, которого передали                          |
| service_type               | SEO / SMM / Ads / Other                            |
| payment_model              | One-time / Monthly / Custom                        |
| amount                     | Сколько партнёр платит Neetrino                    |
| billing_start_date         | Когда начинаем выставлять счета                    |
| status                     | Pending / Active / On Hold / Cancelled / Completed |
| notes                      | Договорённости                                     |

---

## 3. Finance ownership

Деньги по outbound живут в Finance:

- one-time payment -> Invoice Card;
- recurring payment -> Subscription;
- payment received -> Payment;
- revenue shown in P&L.

Partners показывает связь и аналитику, но не заменяет Finance.

---

## 4. Partner Service Subscription

Если партнёр платит регулярно:

```
Partner Service Terms
  -> Subscription type = Partner Service
  -> Invoice generated
  -> Partner pays
  -> Revenue shown in Partners and Finance
```

Плательщик = Partner / Partner Company.

---

## 5. Accepted decisions

| Решение                                                               | Статус   |
| --------------------------------------------------------------------- | -------- |
| Outbound = партнёр платит Neetrino                                    | Accepted |
| Сумма outbound оплаты задаётся по конкретному клиенту / service case  | Accepted |
| Finance является source of truth для invoice / subscription / payment | Accepted |
| Partners показывает связь, status и revenue history                   | Accepted |
