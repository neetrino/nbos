# Partner Analytics and Agreements

## Назначение

Этот документ описывает аналитику партнёров и работу с договорами / соглашениями.

Граница с `Reports / Analytics`:

```text
Partners owns partner-specific analytics and agreement facts.
Reports / Analytics exposes partner reports in the global report catalog, scheduled reports and exports.
```

Partner analytics остаётся внутри Partners, потому что только Partners знает смысл inbound referral, outbound partner service, payout balance и agreement status. Глобальный Reports layer не должен дублировать partner business rules.

---

## 1. Partner Analytics

Analytics должна показывать:

| Метрика                      | Смысл                                               |
| ---------------------------- | --------------------------------------------------- |
| Referred Leads               | Сколько лидов пришло от партнёра                    |
| Won Deals                    | Сколько сделок выиграно                             |
| Conversion Rate              | Won / referred                                      |
| Referred Revenue             | Сколько денег Neetrino получил от клиентов партнёра |
| Accrued Partner Payouts      | Сколько начислено партнёру                          |
| Paid Partner Payouts         | Сколько выплачено                                   |
| Unpaid Balance               | Сколько осталось выплатить                          |
| Active Subscription Accruals | Активные регулярные начисления                      |
| Outbound Revenue             | Сколько партнёр платит Neetrino                     |

---

## 2. Views

Partner analytics должна иметь несколько видов:

- by partner;
- by period;
- by deal type;
- by payment type;
- by project / product;
- by inbound vs outbound.

---

## 3. Agreements

Agreement хранит условия партнёрства и links на документы в Drive.

Поля:

| Поле                 | Назначение                              |
| -------------------- | --------------------------------------- |
| agreement_status     | No Agreement / Draft / Active / Expired |
| agreement_start_date | Начало действия                         |
| agreement_end_date   | Окончание                               |
| document_file        | Drive File Asset: договор / PDF / scan  |
| special_terms        | Особые условия                          |
| owner                | Кто отвечает за партнёра                |

Partner Agreement documents не должны храниться как локальные attachments Partners module. Они являются Drive File Assets с purpose `PARTNER_AGREEMENT`. Для future Partner Account видимость задаётся через Drive `Partner Visible`, но внешний доступ не включается автоматически.

---

## 4. Notifications

| Событие                      | Кому                         | Что происходит                      |
| ---------------------------- | ---------------------------- | ----------------------------------- |
| New referral lead            | CEO / Head of Sales / Seller | Новый лид от партнёра               |
| Partner accrual created      | Finance                      | Появилось начисление партнёру       |
| Payout batch ready           | Finance                      | Пора сформировать / оплатить batch  |
| Agreement expires in 30 days | CEO / Head of Sales          | Нужно продлить договор              |
| Partner paused / terminated  | Sales                        | Нельзя использовать в новых сделках |

---

## 5. Accepted decisions

| Решение                                                | Статус   |
| ------------------------------------------------------ | -------- |
| Analytics разделяет inbound payouts и outbound revenue | Accepted |
| Agreement не определяет процент автоматически          | Accepted |
| Истечение договора должно создавать notification       | Accepted |
| Partner analytics должна показывать unpaid balance     | Accepted |
