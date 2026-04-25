# Partner Commission Policy

## Назначение

`Partner Commission Policy` определяет, какой процент партнёр получает по разным Deal Type.

Главное правило: **Deal Type определяет процент. Payment Type не влияет на процент.**

---

## 1. Deal Type -> Percent

Для каждого партнёра можно настроить проценты по Deal Type.

Пример:

| Deal Type   | Percent |
| ----------- | ------- |
| Product     | 30%     |
| Extension   | 30%     |
| Maintenance | 20%     |
| Outsource   | 10%     |

Если по конкретному Deal Type процент не задан, система может использовать `default_percent` партнёра.

---

## 2. Что не влияет на процент

`Payment Type` не меняет процент партнёра.

Пример:

- Product + Classic = процент Product.
- Product + Subscription = тоже процент Product.
- Extension + Classic = процент Extension.
- Extension + Subscription = тоже процент Extension.

Payment Type влияет только на то, как выплачивается партнёрская сумма.

---

## 3. Фиксация условий на сделке

Когда Lead / Deal получает source = Partner, система должна зафиксировать `Partner Referral Terms`.

В terms фиксируется:

| Поле            | Значение                                                        |
| --------------- | --------------------------------------------------------------- |
| partner         | Партнёр                                                         |
| deal            | Сделка                                                          |
| deal_type       | Product / Extension / Maintenance / Outsource                   |
| payment_type    | Classic / Subscription                                          |
| partner_percent | Процент, зафиксированный на момент сделки                       |
| source_policy   | Откуда взят процент: partner policy / default / manual override |
| override_reason | Причина ручного изменения, если процент изменён                 |

Процент должен фиксироваться на сделке, чтобы будущие изменения policy партнёра не переписывали старые условия.

---

## 4. Override

Seller не должен свободно менять процент партнёра.

Manual override разрешён только:

- CEO;
- Head of Sales;
- Finance Director, если это финансовая корректировка.

Override требует reason и audit log.

---

## 5. Validation

| Момент                       | Правило                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| Deal source = Partner        | Partner обязателен                                              |
| Partner selected             | partner_percent должен быть рассчитан                           |
| Deal Type меняется           | partner_percent пересчитывается, если ещё нет approved override |
| Deal Won                     | Partner Referral Terms должны быть зафиксированы                |
| Order / Subscription created | percent переносится из Partner Referral Terms                   |

---

## 6. Accepted decisions

| Решение                                              | Статус   |
| ---------------------------------------------------- | -------- |
| Процент зависит только от Deal Type                  | Accepted |
| Payment Type не влияет на процент                    | Accepted |
| Процент фиксируется на сделке / order / subscription | Accepted |
| Default percent используется только как fallback     | Accepted |
| Manual override требует reason и audit log           | Accepted |
