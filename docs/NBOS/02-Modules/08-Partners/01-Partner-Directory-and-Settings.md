# Partner Directory and Settings

## Назначение

`Partner Directory` — это справочник партнёров и их базовых условий. Здесь хранится кто партнёр, какой у него тип сотрудничества, контактные данные, стандартные проценты и настройки статуса.

Partner — это отдельная бизнес-сущность. Он может быть связан с Contact и Company, но не заменяется ими.

---

## 1. Partner Card

Минимальные поля:

| Поле                | Назначение                                              |
| ------------------- | ------------------------------------------------------- |
| `name`              | Название партнёра / компании / человека                 |
| `direction`         | Inbound / Outbound / Both                               |
| `level`             | Regular / Premium                                       |
| `status`            | Active / Paused / Terminated                            |
| `primary_contact`   | Основной человек партнёра                               |
| `company`           | Юридическая / биллинговая компания партнёра, если нужна |
| `default_percent`   | Fallback-процент, если policy по Deal Type не заполнена |
| `commission_policy` | Проценты по Deal Type                                   |
| `notes`             | Важные условия и договорённости                         |
| `start_date`        | Дата начала сотрудничества                              |

---

## 2. Direction

| Direction | Смысл                               |
| --------- | ----------------------------------- |
| Inbound   | Партнёр приводит клиентов Neetrino  |
| Outbound  | Neetrino передаёт клиентов партнёру |
| Both      | Партнёр работает в обе стороны      |

Direction влияет на доступные вкладки в карточке партнёра, но не должен смешивать финансовую логику.

---

## 3. Level

| Level   | Смысл                                                              |
| ------- | ------------------------------------------------------------------ |
| Regular | Неформальный или редкий партнёр                                    |
| Premium | Партнёр с подписанными условиями, договором или регулярным потоком |

Premium не означает автоматически больший процент. Процент определяется Commission Policy.

---

## 4. Status

| Status     | Смысл                                                         |
| ---------- | ------------------------------------------------------------- |
| Active     | Партнёр активен                                               |
| Paused     | Временно не используем партнёра или не принимаем новые сделки |
| Terminated | Сотрудничество завершено                                      |

Если Partner = Paused / Terminated, CRM не должна позволять выбрать его как source для новых Lead / Deal без override CEO / Head of Sales.

---

## 5. Partner Card Tabs

| Tab               | Что показывает                                                 |
| ----------------- | -------------------------------------------------------------- |
| Overview          | Общая информация, статус, contact, direction, level            |
| Commission Policy | Проценты по Deal Type                                          |
| Inbound Referrals | Lead / Deal / Order / Subscription, которые пришли от партнёра |
| Payouts & Balance | Accruals, balance, payout batches, paid history                |
| Outbound Services | Клиенты, переданные партнёру, и доход Neetrino                 |
| Agreements        | Договоры, файлы, даты действия                                 |
| Analytics         | Revenue, payouts, conversion, unpaid balance                   |

---

## 6. Правила создания партнёра

Partner может быть создан:

- вручную CEO / Head of Sales;
- из CRM, если Lead пришёл от нового партнёра;
- из Contacts, если Contact с типом Partner становится реальным бизнес-партнёром.

При создании из Contact:

- Contact остаётся человеком;
- Partner создаётся как бизнес-сущность;
- Contact становится primary_contact партнёра.

---

## 7. Validation

| Момент                       | Правило                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Создание Partner             | name, direction, level, status обязательны                                   |
| Partner direction = Inbound  | нужна Commission Policy или default_percent                                  |
| Partner direction = Outbound | нужны условия Partner Service Revenue перед созданием Invoice / Subscription |
| Partner level = Premium      | желательно Agreement, но не блокируем создание                               |
| Partner status = Terminated  | нельзя использовать в новых CRM Deal без override                            |

---

## 8. Accepted decisions

| Решение                                                | Статус   |
| ------------------------------------------------------ | -------- |
| Partner является отдельной бизнес-сущностью            | Accepted |
| Contact с типом Partner не заменяет Partner Card       | Accepted |
| Direction отделяет inbound и outbound сценарии         | Accepted |
| Level не определяет процент автоматически              | Accepted |
| Status управляет доступностью партнёра в новых сделках | Accepted |
