# NBOS Platform — Core Entities & Data Model

## Обзор

Этот документ описывает все ключевые сущности (entities) платформы, их атрибуты и связи между собой. Это фундамент, на котором строятся все модули.

---

## 1. Иерархия сущностей

```
Contact (человек)
  └── Company (юрлицо / физлицо)
        └── Project (бизнес / бренд)
              ├── Product (результат: website, app, logo)
              │     ├── Order (коммерция: сумма, план оплаты)
              │     │     ├── Invoice (счёт на оплату)
              │     │     │     └── Payment (факт оплаты)
              │     │     └── Bonus Entry (бонус за заказ)
              │     ├── Work Package (исполнение: спринт, этап)
              │     │     └── Task (атомарная задача)
              │     └── Support Ticket (обращение клиента)
              │
              ├── Extension (доработка к продукту)
              │     ├── Order
              │     ├── Work Package
              │     └── Task
              │
              ├── Subscription Contract (договор подписки)
              │     ├── Invoice (ежемесячный)
              │     └── Maintenance Work
              │
              ├── Credential (пароль / доступ)
              ├── Asset (файл / документ)
              ├── Chat (проектный чат с топиками)
              └── Audit Log (история изменений)
```

---

## 1.1. Deal Type и Product Type: двухуровневая классификация

**Важно не путать три понятия:**

| Понятие                                                                     | Где задаётся                                                                                                                                                                         | Смысл                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deal Type**                                                               | Справочник **System Lists → Deal Type** (настройки админки). Фиксированный набор **ровно четырёх** значений: `PRODUCT`, `EXTENSION`, `MAINTENANCE`, `OUTSOURCE`                      | Что за сделка по характеру работы и деньгам: новая разработка «как продукт», доработка, техобслуживание, передача аутсорсу. Эти типы **наследуются в Order** и сквозят в CRM и Finance.                                                        |
| **Product Type** (при необходимости переименования в UI — **Service Type**) | Отдельный справочник **System Lists → Product Type** (те же настройки). Список **услуг/направлений** (Website, Mobile App, CRM, Logo, SMM и т.д.), ведётся в админке, меняется редко | Отвечает на вопрос: _если Deal Type = продуктовая разработка (`PRODUCT`), **какая именно услуга** заказана_. Для других Deal Type поле может быть неактуально или заполняться иначе (по правилам сценария).                                    |
| **Сущность Product** (раздел 2.4)                                           | Модель данных проекта                                                                                                                                                                | Результат работ внутри **Project** (сайт, приложение, …). Это **не** то же самое, что значение справочника «PRODUCT» в Deal Type: совпадение имён — только на уровне слов; в коде и документах различать **Deal Type** и **сущность Product**. |

**Правило второго уровня:** поле **Product Type** (из справочника услуг) логически требуется, когда в сделке выбран **Deal Type = PRODUCT** — чтобы определить вид работ и подтянуть правила стартовой delivery-стадии и последующих stage gates.

**Starting и обязательные поля:** на стартовой стадии delivery у проекта/продукта набор обязательных полей и чеклистов **зависит от выбранного Product Type** (например, для Mobile App — аккаунты App Store и Google Play; для Website — хостинг, админка, домен и т.д.). Эти зависимости задаются конфигурацией по типу услуги, а не произвольно на карточке.

**Админка:** оба справочника (**Deal Type** и **Product Type**) сейчас настраиваются через **Settings → Lists**. Набор Deal Type **ограничен четырьмя** кодами выше; расширять список Deal Type для новых «видов работ» не планируется — для детализации используется **Product Type** и сценарии по Deal Type.

---

## 2. Описание каждой сущности

### 2.1. Contact (Контакт)

Физическое лицо — человек, с которым ведётся взаимодействие.

| Поле            | Тип      | Описание                           |
| --------------- | -------- | ---------------------------------- |
| id              | UUID     | Уникальный идентификатор           |
| first_name      | String   | Имя                                |
| last_name       | String   | Фамилия                            |
| phone           | String   | Телефон (основной)                 |
| email           | String   | Email                              |
| messenger_links | JSON     | WhatsApp, Telegram, Instagram      |
| role            | Enum     | Client, Partner, Contractor, Other |
| notes           | Text     | Заметки                            |
| created_at      | DateTime | Дата создания                      |

**Связи:**

- Contact → many Projects (один человек может заказать много проектов для разных бизнесов)
- Contact → many Companies (один человек может представлять несколько юрлиц)
- Contact → many Deals (один контакт может быть в нескольких сделках)

---

### 2.2. Company (Компания)

Юридическое лицо или ИП — для выставления счетов.

| Поле          | Тип          | Описание                                  |
| ------------- | ------------ | ----------------------------------------- |
| id            | UUID         | Уникальный идентификатор                  |
| name          | String       | Название компании                         |
| type          | Enum         | Legal Entity, Individual, Sole Proprietor |
| tax_id        | String       | ИНН / VOEN / Tax ID                       |
| legal_address | String       | Юридический адрес                         |
| bank_details  | JSON         | Банковские реквизиты                      |
| tax_status    | Enum         | Tax (налогооблагаемый), Tax-Free          |
| contact_id    | FK → Contact | Основной контакт                          |
| notes         | Text         | Заметки                                   |

**Связи:**

- Company → many Projects
- Company → many Invoices (счета выставляются на компанию)

---

### 2.3. Project (Проект)

**Центральная сущность платформы.** Один проект = один бизнес / бренд клиента.

| Поле        | Тип           | Описание                                    |
| ----------- | ------------- | ------------------------------------------- |
| id          | UUID          | Уникальный идентификатор                    |
| name        | String        | Название проекта (обычно = название бренда) |
| contact_id  | FK → Contact  | Основной контакт                            |
| company_id  | FK → Company  | Юрлицо для биллинга                         |
| type        | Enum          | White Label, Mix, Custom Code               |
| status      | Computed      | Вычисляется из статусов Products (см. ниже) |
| seller_id   | FK → Employee | Ответственный продажник                     |
| pm_id       | FK → Employee | Ответственный PM                            |
| deadline    | Date          | Общий дедлайн проекта                       |
| description | Text          | Описание проекта                            |
| created_at  | DateTime      | Дата создания                               |
| archived_at | DateTime      | Дата архивации (если закрыт)                |

**Вычисляемый статус проекта:**

- Проект не имеет собственного статуса. Его "состояние" определяется статусами его Products:
  - Если хотя бы один Product в статусе Development → проект видим в табе "Development"
  - Если хотя бы один Product в статусе Maintenance → проект видим в табе "Maintenance"
  - Проект может быть одновременно в нескольких табах
  - Если все Products в статусе Closed → проект в табе "Closed"

**Связи:**

- Project → many Products
- Project → many Extensions
- Project → many Subscription Contracts
- Project → many Credentials
- Project → many Assets
- Project → many Chats
- Project → many Audit Logs
- Project → one Contact
- Project → one Company

---

### 2.4. Product (Продукт)

Конкретный результат работы внутри проекта: website, mobile app, logo, CRM system.

`Product` — центральная delivery-сущность внутри `Project`. Именно вокруг него строятся delivery board, задачи, QA, transfer, credentials и support context.

| Поле               | Тип                               | Описание                                                                               |
| ------------------ | --------------------------------- | -------------------------------------------------------------------------------------- |
| id                 | UUID                              | Уникальный идентификатор                                                               |
| project_id         | FK → Project                      | Проект                                                                                 |
| name               | String                            | Название продукта ("Website", "Mobile App")                                            |
| product_type       | FK → System List **Product Type** | Вид услуги (Website, Mobile App, CRM, …); значения из справочника в админке, см. § 1.1 |
| stage              | Enum                              | `STARTING`, `DEVELOPMENT`, `QA`, `TRANSFER`                                            |
| work_status        | Enum                              | `ACTIVE`, `ON_HOLD`                                                                    |
| resolution         | Enum / Null                       | `DONE`, `CANCELLED`, `null`                                                            |
| order_id           | FK → Order                        | Связанный заказ                                                                        |
| pm_id              | FK → Employee                     | PM продукта                                                                            |
| deadline           | Date                              | Дедлайн продукта                                                                       |
| description        | Text                              | Описание, техзадание                                                                   |
| checklist_template | FK → Template                     | Шаблон чеклиста по типу продукта                                                       |
| on_hold_reason     | String / Null                     | Причина паузы                                                                          |
| on_hold_until      | Date / Null                       | До какой даты длится hold                                                              |
| created_at         | DateTime                          | Дата создания                                                                          |

**Канонический lifecycle Product:**

- Active stages: `Starting -> Development -> QA -> Transfer`
- Pause state: `On Hold` как отдельный `work_status`, а не stage
- Terminal outcomes: `Done` и `Cancelled`

Переход между стадиями контролируется stage gates. Если карточку переводят сразу в позднюю стадию или сразу в `Done`, система должна выполнять cumulative validation по пропущенным шагам.

**Связи:**

- Product → one Order
- Product → many Work Packages
- Product → many Tasks
- Product → many Support Tickets
- Product → one Project

---

### 2.5. Extension (Доработка)

Дополнительная работа к существующему продукту: новая функция, улучшение, доп. модуль.

`Extension` — отдельная delivery-сущность, но всегда в контексте существующего `Project` и одного основного `Product`.

| Поле           | Тип           | Описание                                                                  |
| -------------- | ------------- | ------------------------------------------------------------------------- |
| id             | UUID          | Уникальный идентификатор                                                  |
| project_id     | FK → Project  | Проект                                                                    |
| product_id     | FK → Product  | К какому продукту относится доработка                                     |
| name           | String        | Название доработки                                                        |
| size           | Enum          | Micro (< 1 день), Small (1–3 дня), Medium (1–2 недели), Large (2+ недели) |
| stage          | Enum          | `STARTING`, `DEVELOPMENT`, `QA`, `TRANSFER`                               |
| work_status    | Enum          | `ACTIVE`, `ON_HOLD`                                                       |
| resolution     | Enum / Null   | `DONE`, `CANCELLED`, `null`                                               |
| order_id       | FK → Order    | Связанный заказ                                                           |
| assigned_to    | FK → Employee | Исполнитель                                                               |
| description    | Text          | Описание                                                                  |
| on_hold_reason | String / Null | Причина паузы                                                             |
| on_hold_until  | Date / Null   | До какой даты длится hold                                                 |
| created_at     | DateTime      | Дата создания                                                             |

**Важно:** Extension — это тоже Order с коммерческой стороны. Разница с Product:

- Product = полный жизненный цикл (месяцы работы)
- Extension = доработка (от 1 часа до 1 месяца)
- Оба генерируют бонусы через связанный Order

**Источник данных Extension:**

- часть данных приходит из `Deal`;
- часть из `Project`;
- часть из связанного `Product`.

**Связи:**

- Extension → one Order
- Extension → many Tasks
- Extension → one Project
- Extension → one Product

---

### 2.6. Order (Заказ)

Коммерческая единица: что продали, за сколько, как оплачивается. Классификация по смыслу **Deal Type** сделки (см. § 1.1): `PRODUCT`, `EXTENSION`, `MAINTENANCE`, `OUTSOURCE` — переносится из Deal; подписка учитывается в **payment_type** и сущности Subscription, а не как отдельный «тип заказа» вместо четырёх значений.

| Поле                   | Тип                        | Описание                                                            |
| ---------------------- | -------------------------- | ------------------------------------------------------------------- |
| id                     | UUID                       | Уникальный идентификатор                                            |
| project_id             | FK → Project               | Проект                                                              |
| deal_id                | FK → Deal                  | Сделка, из которой создан                                           |
| deal_type              | FK → System List Deal Type | Как у Deal: PRODUCT / EXTENSION / MAINTENANCE / OUTSOURCE           |
| payment_type           | Enum                       | Classic 50/50, Classic 30/30/40, Subscription Monthly               |
| total_amount           | Decimal                    | Общая сумма заказа                                                  |
| currency               | Enum                       | AMD (default), USD, EUR                                             |
| tax_status             | Enum                       | Tax, Tax-Free                                                       |
| status                 | Enum                       | Active, Partially Paid, Fully Paid, Closed, Cancelled               |
| partner_id             | FK → Partner               | Партнёр-реферал (если есть)                                         |
| partner_percent        | Decimal                    | % партнёра (обычно 30%)                                             |
| seller_id              | FK → Employee              | Продавец                                                            |
| seller_bonus_percent   | Decimal                    | % бонуса продавца (5–10%)                                           |
| seller_bonus_source    | Enum                       | Cold Call, Marketing Lead, Existing Client, Partner Referral        |
| delivery_bonus_percent | Decimal                    | % бонуса delivery (зависит от типа проекта: WL 7%, Mix 10%, CC 15%) |
| deadline               | Date                       | Дедлайн                                                             |
| notes                  | Text                       | Заметки                                                             |
| created_at             | DateTime                   | Дата создания                                                       |
| closed_at              | DateTime                   | Дата закрытия                                                       |

**Связи:**

- Order → many Invoices
- Order → many Bonus Entries
- Order → one Deal (источник)
- Order → one Project
- Order → one Product OR one Extension
- Order → one Partner (если реферал)

---

### 2.7. Invoice (Счёт)

Карточка денег, которые клиент должен нам заплатить. В интерфейсе пока может называться `Invoice`, но по бизнес-смыслу это control card ожидаемой оплаты. Один Order может иметь несколько Invoice Card.

| Поле                          | Тип               | Описание                                                       |
| ----------------------------- | ----------------- | -------------------------------------------------------------- |
| id                            | UUID              | Уникальный идентификатор                                       |
| order_id                      | FK → Order        | Заказ                                                          |
| subscription_id               | FK → Subscription | Подписка (если subscription invoice)                           |
| project_id                    | FK → Project      | Проект                                                         |
| company_id                    | FK → Company      | Кому выставлен (юрлицо)                                        |
| amount                        | Decimal           | Сумма счёта                                                    |
| currency                      | Enum              | AMD, USD, EUR                                                  |
| tax_status                    | Enum              | Tax, Free (наследуется от Order/Subscription/Domain/Service)   |
| type                          | Enum              | Development, Extension, Subscription, Domain, Service, Other   |
| money_status                  | Enum              | New, Awaiting Payment, Overdue, On Hold, Paid, Cancelled       |
| notifications_enabled         | Boolean           | Разрешены ли клиентские напоминания                            |
| due_date                      | Date              | Дата, до которой нужно оплатить                                |
| paid_date                     | Date              | Фактическая дата оплаты                                        |
| official_request_sent         | Boolean           | Отправлен ли запрос на официальный счёт в бухгалтерскую группу |
| official_request_sent_at      | DateTime?         | Когда отправили запрос                                         |
| official_request_cancelled_at | DateTime?         | Когда отменили предыдущий запрос                               |
| notes                         | Text              | Заметки                                                        |
| created_at                    | DateTime          | Дата создания                                                  |

**Принципы Invoice Card:**

1. `Tax = Free` — официальный счёт не нужен.
2. `Tax = Tax` — может потребоваться запрос в бухгалтерскую WhatsApp-группу.
3. Пока `official_request_sent = false`, клиентские напоминания не должны отправляться для `Tax`.
4. Статус карточки отражает именно состояние денег, а не состояние уведомлений.

**Связи:**

- Invoice → one Payment (при оплате)
- Invoice → one Order OR one Subscription
- Invoice → one Company

---

### 2.8. Payment (Платёж)

Факт поступления денег.

| Поле           | Тип           | Описание                         |
| -------------- | ------------- | -------------------------------- |
| id             | UUID          | Уникальный идентификатор         |
| invoice_id     | FK → Invoice  | Связанный счёт                   |
| amount         | Decimal       | Сумма                            |
| currency       | Enum          | AMD, USD, EUR                    |
| payment_date   | Date          | Дата поступления                 |
| payment_method | Enum          | Bank Transfer, Cash, Card, Other |
| confirmed_by   | FK → Employee | Кто подтвердил (финдиректор)     |
| notes          | Text          | Заметки                          |

**Связи:**

- Payment → one Invoice
- Payment triggers: Bonus Entry creation, Order status update, Partner Payout creation

---

### 2.9. Subscription Contract (Контракт подписки)

Повторяющееся коммерческое соглашение: клиент платит фиксированную сумму регулярно.

| Поле                  | Тип          | Описание                                                                       |
| --------------------- | ------------ | ------------------------------------------------------------------------------ |
| id                    | UUID         | Уникальный идентификатор                                                       |
| project_id            | FK → Project | Проект                                                                         |
| type                  | Enum         | Maintenance Only, Development + Maintenance, Development Only, Partner Service |
| base_monthly_amount   | Decimal      | Базовая стоимость одного месяца                                                |
| currency              | Enum         | AMD                                                                            |
| tax_status            | Enum         | Tax, Free                                                                      |
| notifications_enabled | Boolean      | Разрешены ли автоматические уведомления по карточкам оплат                     |
| billing_frequency     | Enum         | Monthly, Yearly, Custom                                                        |
| billing_day           | Integer      | День месяца для биллинга (1–28), если применяется месячная логика              |
| billing_start_date    | Date         | Дата старта биллинга                                                           |
| end_date              | Date         | Дата окончания (null = бессрочно)                                              |
| status                | Enum         | Pending, Active, On Hold, Cancelled, Completed                                 |
| partner_id            | FK → Partner | Партнёр (если partner service)                                                 |
| partner_percent       | Decimal      | % партнёра                                                                     |
| notes                 | Text         | Заметки                                                                        |

**Связи:**

- Subscription → many Invoice Cards (каждая может покрывать один или несколько месяцев)
- Subscription → one Project
- Subscription → one Partner (опционально)

---

### 2.10. Expense Plan / Expense Card / Expense Payment (Расходы)

Расходы разделяются на три сущности:

- `Expense Plan / План расхода` — правило или ожидание будущего расхода.
- `Expense Card / Карточка расхода` — конкретная сумма, которую нужно оплатить.
- `Expense Payment / Оплата расхода` — факт частичной или полной оплаты.

#### Expense Plan

| Поле                     | Тип                        | Описание                                                                                 |
| ------------------------ | -------------------------- | ---------------------------------------------------------------------------------------- |
| id                       | UUID                       | Уникальный идентификатор                                                                 |
| name                     | String                     | Название плана                                                                           |
| category                 | Enum                       | Domain, Hosting, Service, Marketing, Salary, Bonus, Partner Payout, Tools, Office, Other |
| amount                   | Decimal                    | Ожидаемая сумма                                                                          |
| currency                 | Enum                       | AMD, USD, EUR                                                                            |
| frequency                | Enum                       | One-time, Monthly, Quarterly, Yearly, Custom                                             |
| next_due_date            | Date                       | Следующая дата оплаты                                                                    |
| provider                 | String                     | Поставщик                                                                                |
| project_id               | FK → Project               | Проект, если расход проектный                                                            |
| product_id               | FK → Product               | Продукт, если применимо                                                                  |
| client_service_record_id | FK → Client Service Record | Сервис клиента, если план идёт от него                                                   |
| auto_generate            | Boolean                    | Создавать ли карточки автоматически                                                      |
| notes                    | Text                       | Заметки                                                                                  |

#### Expense Card

| Поле                     | Тип                        | Описание                                                                                 |
| ------------------------ | -------------------------- | ---------------------------------------------------------------------------------------- |
| id                       | UUID                       | Уникальный идентификатор                                                                 |
| source_type              | Enum                       | Manual, Expense Plan, Client Service, Payroll, Bonus, Partner Payout                     |
| category                 | Enum                       | Domain, Hosting, Service, Marketing, Salary, Bonus, Partner Payout, Tools, Office, Other |
| name                     | String                     | Название карточки                                                                        |
| original_amount          | Decimal                    | Исходная сумма                                                                           |
| paid_amount              | Decimal                    | Уже оплачено                                                                             |
| remaining_amount         | Decimal                    | Осталось оплатить                                                                        |
| currency                 | Enum                       | AMD, USD, EUR                                                                            |
| due_date                 | Date                       | Дата оплаты                                                                              |
| workflow_status          | Enum                       | Planned, Due Soon, Due Now, Overdue, On Hold, Backlog, Paid, Cancelled                   |
| payment_status           | Enum                       | Unpaid, Partially Paid, Paid                                                             |
| backlog_reason           | Enum                       | Debt to Pay Later, Waiting for Decision, Waiting for Client, Waiting for Provider, Other |
| project_id               | FK → Project               | Привязка к проекту                                                                       |
| product_id               | FK → Product               | Привязка к продукту                                                                      |
| order_id                 | FK → Order                 | Привязка к заказу                                                                        |
| partner_id               | FK → Partner               | Партнёр, если partner payout                                                             |
| client_service_record_id | FK → Client Service Record | Сервис клиента                                                                           |
| invoice_card_id          | FK → Invoice Card          | Карточка оплаты клиента, если pass-through                                               |
| owner_id                 | FK → Employee              | Ответственный                                                                            |
| notes                    | Text                       | Заметки                                                                                  |

#### Expense Payment

| Поле            | Тип               | Описание                        |
| --------------- | ----------------- | ------------------------------- |
| id              | UUID              | Уникальный идентификатор        |
| expense_card_id | FK → Expense Card | Связанная карточка расхода      |
| amount          | Decimal           | Сумма оплаты                    |
| currency        | Enum              | AMD, USD, EUR                   |
| paid_at         | DateTime          | Дата оплаты                     |
| paid_by_id      | FK → Employee     | Кто отметил оплату              |
| payment_method  | String            | Метод оплаты, если используется |
| attachment_id   | FK → File         | Подтверждение оплаты, если есть |
| comment         | Text              | Комментарий                     |

**Связи:**

- Expense Plan → many Expense Cards
- Expense Card → many Expense Payments
- Client Service Record → Invoice Card → Payment → Expense Card → Task
- Payroll Run → Expense Card
- Expense Card → one Project / Product / Order (опционально)
- Expense Card → one Partner (для partner payouts)

---

### 2.11. Bonus Entry (Запись бонуса)

Единица бонусного учёта.

| Поле                  | Тип           | Описание                                                                        |
| --------------------- | ------------- | ------------------------------------------------------------------------------- |
| id                    | UUID          | Уникальный идентификатор                                                        |
| employee_id           | FK → Employee | Сотрудник                                                                       |
| order_id              | FK → Order    | Заказ, за который начислен                                                      |
| project_id            | FK → Project  | Проект                                                                          |
| type                  | Enum          | Sales Bonus, Delivery Bonus, PM Bonus, Design Bonus, Marketing Bonus            |
| amount                | Decimal       | Сумма бонуса                                                                    |
| percent               | Decimal       | % от суммы заказа                                                               |
| status                | Enum          | Incoming, Earned, Pending Eligibility, Vested, Holdback, Active, Paid, Clawback |
| kpi_gate_result       | JSON          | Результат KPI gate, если применяется                                            |
| planned_amount        | Decimal       | Плановый бонус по project/order pool                                            |
| released_amount       | Decimal       | Сколько уже выпущено к выплате                                                  |
| paid_amount           | Decimal       | Сколько реально выплачено                                                       |
| remaining_amount      | Decimal       | Остаток по плановому бонусу                                                     |
| extra_bonus_amount    | Decimal       | Сумма сверх планового бонуса                                                    |
| over_funding_amount   | Decimal       | Сумма сверх доступного проектного фонда                                         |
| holdback_percent      | Decimal       | % удержания (20% по умолчанию)                                                  |
| holdback_release_date | Date          | Дата освобождения holdback                                                      |
| earn_event            | String        | Событие начисления ("Invoice Paid", "Work Done + Paid")                         |
| payout_month          | String        | Месяц выплаты (YYYY-MM)                                                         |
| paid_date             | Date          | Фактическая дата выплаты                                                        |
| notes                 | Text          | Заметки                                                                         |

**Состояния бонуса:**

1. **Incoming** — бонус будет начислен после выполнения работы (видно как прогноз)
2. **Earned** — событие произошло (работа сдана / инвойс оплачен)
3. **Pending Eligibility** — ожидание KPI-гейта / acceptance / полной оплаты
4. **Vested** — разрешено к выплате (KPI пройден)
5. **Holdback** — 20% удержано на 14–30 дней
6. **Active** — готов к выплате в следующем payroll run
7. **Paid** — выплачен
8. **Clawback** — откат (refund/chargeback/спор)

**Связи:**

- Bonus Entry → one Employee
- Bonus Entry → one Order
- Bonus Entry → one Project
- Bonus Entry → one Payroll Run / Salary Line when included in payout
- Bonus Entry → many Bonus Releases

---

### 2.11.0.1. Project Bonus Pool (Бонусный фонд проекта)

Плановый бонусный фонд проекта или order. Нужен, чтобы разделить "сколько положено" и "сколько уже можно выплатить".

| Поле                   | Тип          | Описание                                   |
| ---------------------- | ------------ | ------------------------------------------ |
| id                     | UUID         | Уникальный идентификатор                   |
| project_id             | FK → Project | Проект                                     |
| order_id               | FK → Order   | Заказ, если применимо                      |
| total_planned_amount   | Decimal      | Общая плановая сумма бонусов               |
| total_released_amount  | Decimal      | Уже выпущено к выплате                     |
| total_paid_amount      | Decimal      | Уже выплачено                              |
| total_remaining_amount | Decimal      | Остаток планового бонуса                   |
| available_funding      | Decimal      | Доступный фонд из полученных оплат клиента |
| over_funding_amount    | Decimal      | Выпущено сверх полученных денег            |
| status                 | Enum         | Draft, Active, Partially Released, Closed  |

### 2.11.0.2. Bonus Release (Выпуск бонуса)

Решение включить часть бонуса в конкретный payroll.

| Поле           | Тип              | Описание                                              |
| -------------- | ---------------- | ----------------------------------------------------- |
| id             | UUID             | Уникальный идентификатор                              |
| bonus_entry_id | FK → Bonus Entry | Бонусная запись                                       |
| payroll_run_id | FK → Payroll Run | Зарплатный расчёт                                     |
| employee_id    | FK → Employee    | Сотрудник                                             |
| project_id     | FK → Project     | Проект                                                |
| amount         | Decimal          | Сумма выпуска                                         |
| release_type   | Enum             | Auto, Manual, Early, Extra, Over Funding, Correction  |
| reason         | Text             | Причина, обязательна для Early/Extra/Over Funding     |
| approved_by_id | FK → Employee    | Кто утвердил exception                                |
| status         | Enum             | Draft, Approved, Included In Payroll, Paid, Cancelled |

`Bonus Release` создаётся автоматически после сдачи проекта, если есть доступный проектный фонд, или вручную до сдачи / при исключениях.

---

### 2.11.1. Compensation Profile (Профиль оплаты сотрудника)

Постоянные правила оплаты сотрудника. Живёт в контуре `My Company / Team`, а Finance использует его при payroll.

| Поле            | Тип               | Описание                             |
| --------------- | ----------------- | ------------------------------------ |
| id              | UUID              | Уникальный идентификатор             |
| employee_id     | FK → Employee     | Сотрудник                            |
| base_salary     | Decimal           | Минимальная / фиксированная зарплата |
| currency        | Enum              | AMD, USD, EUR                        |
| primary_seat_id | FK → Seat         | Основной seat на момент профиля      |
| level           | Enum              | Уровень сотрудника                   |
| bonus_policy_id | FK → Bonus Policy | Активное правило бонусов             |
| kpi_policy_id   | FK → KPI Policy   | Активное правило KPI                 |
| payout_schedule | JSON              | График выплат                        |
| effective_from  | Date              | Дата начала действия                 |
| effective_to    | Date              | Дата окончания, если профиль заменён |
| status          | Enum              | Draft, Review, Active, Archived      |

**Связи:**

- Employee → many Compensation Profiles
- Active Compensation Profile → Payroll Run input

---

### 2.11.1.1. Policy Template (Шаблон правила)

Безопасный тип правила, реализованный в коде. UI меняет параметры, но не создаёт произвольную бизнес-логику.

| Поле           | Тип    | Описание                              |
| -------------- | ------ | ------------------------------------- |
| id             | UUID   | Уникальный идентификатор              |
| code           | String | Код шаблона                           |
| type           | Enum   | Bonus, KPI, Release, Holdback, Manual |
| name           | String | Название                              |
| allowed_params | JSON   | Какие параметры можно менять в UI     |
| status         | Enum   | Active, Deprecated                    |

### 2.11.1.2. Bonus Policy (Правило бонусов)

Активное правило расчёта бонусов.

| Поле           | Тип                  | Описание                                   |
| -------------- | -------------------- | ------------------------------------------ |
| id             | UUID                 | Уникальный идентификатор                   |
| template_id    | FK → Policy Template | Шаблон правила                             |
| scope          | Enum                 | Company, Department, Seat, Level, Employee |
| scope_id       | UUID                 | ID объекта scope                           |
| params         | JSON                 | Проценты, фильтры, caps, holdback, release |
| effective_from | Date                 | С какой даты действует                     |
| effective_to   | Date                 | Когда перестало действовать                |
| status         | Enum                 | Draft, Active, Archived                    |
| approved_by_id | FK → Employee        | Кто утвердил                               |

### 2.11.1.3. KPI Policy (Правило KPI)

Активное правило KPI и KPI gate.

| Поле           | Тип                  | Описание                                   |
| -------------- | -------------------- | ------------------------------------------ |
| id             | UUID                 | Уникальный идентификатор                   |
| template_id    | FK → Policy Template | Шаблон KPI                                 |
| scope          | Enum                 | Company, Department, Seat, Level, Employee |
| scope_id       | UUID                 | ID объекта scope                           |
| metrics        | JSON                 | KPI metrics                                |
| weights        | JSON                 | Веса метрик                                |
| gate_rules     | JSON                 | Пороги выплаты                             |
| period         | Enum                 | Week, Month, Quarter, Sprint               |
| effective_from | Date                 | С какой даты действует                     |
| effective_to   | Date                 | Когда перестало действовать                |
| status         | Enum                 | Draft, Active, Archived                    |

### 2.11.1.4. Employee Policy Override (Индивидуальное исключение)

Персональное правило сотрудника, которое перекрывает department/seat/level policy.

| Поле            | Тип           | Описание                       |
| --------------- | ------------- | ------------------------------ |
| id              | UUID          | Уникальный идентификатор       |
| employee_id     | FK → Employee | Сотрудник                      |
| policy_type     | Enum          | Bonus, KPI, Compensation       |
| base_policy_id  | UUID          | Какое правило переопределяется |
| override_params | JSON          | Что меняется                   |
| reason          | Text          | Причина, обязательна           |
| effective_from  | Date          | С какой даты действует         |
| effective_to    | Date          | Когда перестало действовать    |
| approved_by_id  | FK → Employee | Кто утвердил                   |
| status          | Enum          | Draft, Active, Archived        |

---

### 2.11.2. Payroll Run (Зарплатный расчёт)

Месячный контейнер расчёта зарплат и бонусов.

| Поле              | Тип           | Описание                                |
| ----------------- | ------------- | --------------------------------------- |
| id                | UUID          | Уникальный идентификатор                |
| payroll_month     | String        | Месяц расчёта, YYYY-MM                  |
| status            | Enum          | Draft, Review, Approved, Paying, Closed |
| total_base_salary | Decimal       | Сумма фиксированных зарплат             |
| total_bonuses     | Decimal       | Сумма бонусов                           |
| total_adjustments | Decimal       | Корректировки                           |
| total_deductions  | Decimal       | Удержания                               |
| total_payable     | Decimal       | Итого к выплате                         |
| total_paid        | Decimal       | Уже выплачено                           |
| created_by_id     | FK → Employee | Кто создал / запустил расчёт            |
| approved_by_id    | FK → Employee | Кто утвердил                            |
| approved_at       | DateTime      | Когда утверждён                         |
| closed_at         | DateTime      | Когда закрыт                            |

**Связи:**

- Payroll Run → many Salary Lines
- Payroll Run → many Expense Cards
- Payroll Run → many Bonus Entries through Salary Lines

---

### 2.11.3. Salary Line (Строка зарплаты сотрудника)

Запись `employee + month` внутри payroll run.

| Поле                    | Тип                       | Описание                                      |
| ----------------------- | ------------------------- | --------------------------------------------- |
| id                      | UUID                      | Уникальный идентификатор                      |
| payroll_run_id          | FK → Payroll Run          | Зарплатный расчёт                             |
| employee_id             | FK → Employee             | Сотрудник                                     |
| compensation_profile_id | FK → Compensation Profile | Профиль оплаты на момент расчёта              |
| base_salary             | Decimal                   | Фикс за месяц                                 |
| bonuses_total           | Decimal                   | Бонусы за месяц                               |
| adjustments_total       | Decimal                   | Корректировки                                 |
| deductions_total        | Decimal                   | Удержания                                     |
| total_payable           | Decimal                   | Итого к выплате                               |
| paid_amount             | Decimal                   | Уже выплачено                                 |
| remaining_amount        | Decimal                   | Осталось выплатить                            |
| status                  | Enum                      | Pending, Approved, Partially Paid, Paid, Held |
| expense_card_id         | FK → Expense Card         | Связанная карточка расхода                    |

**Связи:**

- Salary Line → many Bonus Entries
- Salary Line → one Expense Card
- Expense Card → many Expense Payments

---

### 2.12. Lead (Лид)

Входящее обращение потенциального клиента.

| Поле          | Тип           | Описание                                                                                            |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| id            | UUID          | Уникальный идентификатор                                                                            |
| contact_name  | String        | Имя                                                                                                 |
| phone         | String        | Телефон                                                                                             |
| email         | String        | Email                                                                                               |
| source        | Enum          | Верхний источник: Marketing, Sales, Partner, Client                                                 |
| source_detail | Enum / String | Канал внутри источника                                                                              |
| status        | Enum          | New, Didn't Get Through, Contact Established, Qualification (MQL), SPAM, Frozen, Quality Lead (SQL) |
| assigned_to   | FK → Employee | Ответственный                                                                                       |
| notes         | Text          | Заметки                                                                                             |
| created_at    | DateTime      | Дата создания                                                                                       |

**Связи:**

- Lead → one Deal (при конверсии SQL → Deal)
- Lead → one Contact (при создании контакта)

---

### 2.13. Deal (Сделка)

Активная продажа. Создаётся из Lead (SQL), вручную в CRM или из контекста проекта. Вид сделки задаётся справочником **Deal Type** (четыре значения), детализация услуги — справочником **Product Type** при необходимости (см. § 1.1).

| Поле              | Тип                           | Описание                                                                                                                                                          |
| ----------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                | UUID                          | Уникальный идентификатор                                                                                                                                          |
| lead_id           | FK → Lead                     | Источник (для новых клиентов)                                                                                                                                     |
| project_id        | FK → Project                  | Проект (для extension deals)                                                                                                                                      |
| contact_id        | FK → Contact                  | Контакт                                                                                                                                                           |
| deal_type         | FK → System List Deal Type    | `PRODUCT`, `EXTENSION`, `MAINTENANCE`, `OUTSOURCE`                                                                                                                |
| product_type      | FK → System List Product Type | Вид услуги (Website, Mobile App, …); в первую очередь при `deal_type = PRODUCT`                                                                                   |
| status            | Enum                          | Start a Conversation … Deposit & Contract (последняя рабочая), затем **Failed** или **Deal Won** — без Delivery Board / Get Final Pay / Maintenance billing в CRM |
| amount            | Decimal                       | Ожидаемая сумма                                                                                                                                                   |
| payment_type      | Enum                          | Classic 50/50, Classic 30/30/40, Subscription                                                                                                                     |
| seller_id         | FK → Employee                 | Ответственный продажник                                                                                                                                           |
| deadline          | Date                          | Для `PRODUCT/EXTENSION/OUTSOURCE` — delivery deadline; для `MAINTENANCE` — planned maintenance start date                                                         |
| source            | Enum                          | Верхний источник: Marketing, Sales, Partner, Client                                                                                                               |
| source_detail     | Enum / String                 | Канал внутри источника                                                                                                                                            |
| source_partner_id | FK → Partner                  | Партнёр-источник, если применимо                                                                                                                                  |
| source_contact_id | FK → Contact                  | Клиент/реферал-источник, если применимо                                                                                                                           |
| offer_url         | String                        | Legacy single-link field; canonical business model uses offer materials (file / link / messenger proof)                                                           |
| notes             | Text                          | Заметки                                                                                                                                                           |
| created_at        | DateTime                      | Дата создания                                                                                                                                                     |
| closed_at         | DateTime                      | Дата закрытия                                                                                                                                                     |

**Связи:**

- Deal → one Order (при успешном закрытии)
- Deal → one Lead (источник)
- Deal → one Contact
- Deal → one Project (для extensions)

---

### 2.14. Support Ticket (Тикет)

Клиентский кейс по существующему проекту/продукту. Ticket не равен задаче: он хранит обращение, SLA и клиентскую историю, а исполнение идёт через linked tasks / work spaces.

| Поле                     | Тип           | Описание                                                                       |
| ------------------------ | ------------- | ------------------------------------------------------------------------------ |
| id                       | UUID          | Уникальный идентификатор                                                       |
| project_id               | FK → Project  | Проект                                                                         |
| product_id               | FK → Product  | Продукт (опционально, но канонически желателен если кейс относится к продукту) |
| contact_id               | FK → Contact  | Кто обратился                                                                  |
| category                 | Enum          | Incident, Service Request, Change Request, Problem                             |
| priority                 | Enum          | P1 Critical, P2 High, P3 Normal                                                |
| status                   | Enum          | New, Triaged, Assigned, In Progress, Resolved, Closed                          |
| waiting_state            | Enum?         | Waiting for Client, Waiting for Third Party, Escalated                         |
| billable                 | Boolean       | Платная работа?                                                                |
| assigned_to              | FK → Employee | Текущий владелец / исполнитель кейса                                           |
| linked_extension_deal_id | FK → Deal     | Если ticket ушёл в change control                                              |
| sla_response_deadline    | DateTime      | Дедлайн первой реакции                                                         |
| sla_resolve_deadline     | DateTime      | Дедлайн решения                                                                |
| description              | Text          | Описание проблемы / запроса                                                    |
| resolution               | Text          | Описание решения                                                               |
| created_at               | DateTime      | Дата создания                                                                  |
| resolved_at              | DateTime      | Дата решения                                                                   |
| closed_at                | DateTime      | Дата закрытия                                                                  |

**Связи:**

- Ticket → one Project
- Ticket → one Product (опционально)
- Ticket → one Contact
- Ticket → may create / link Extension Deal (если Change Request = платная работа)
- Ticket → may have many linked Tasks

---

### 2.15. Credential (Пароль / Доступ)

| Поле              | Тип                | Описание                                                               |
| ----------------- | ------------------ | ---------------------------------------------------------------------- |
| id                | UUID               | Уникальный идентификатор                                               |
| project_id        | FK → Project       | Проект (опционально, null = company-level)                             |
| category          | Enum               | Admin, Domain, Hosting, Service, App, Mail, API Key, Database, Other   |
| provider          | Enum               | Beget, Reg.ru, Cloudflare, Neon, Upstash, Resend, Google, Apple, Other |
| name              | String             | Название ("Cloudflare Account", "Production DB")                       |
| url               | String             | URL входа                                                              |
| login             | String (encrypted) | Логин                                                                  |
| password          | String (encrypted) | Пароль                                                                 |
| api_key           | String (encrypted) | API ключ (опционально)                                                 |
| env_data          | Text (encrypted)   | Содержимое .env файла (опционально)                                    |
| phone             | String             | Привязанный телефон                                                    |
| access_level      | Enum               | Secret, Project Team, Department, All                                  |
| allowed_employees | FK[] → Employee    | Конкретные сотрудники с доступом (для Secret level)                    |
| owner_id          | FK → Employee      | Кто создал / владелец                                                  |
| notes             | Text               | Заметки                                                                |
| created_at        | DateTime           | Дата создания                                                          |
| updated_at        | DateTime           | Дата последнего изменения                                              |

**Связи:**

- Credential → one Project (опционально)
- Credential → many Employees (через access rules)
- Credential → Audit Log (каждый view/edit логируется)

---

### 2.16. Domain (Домен)

Частный случай `Client Service Record`: домен проекта клиента с датой продления, себестоимостью и возможной ценой для клиента.

| Поле          | Тип             | Описание                                                 |
| ------------- | --------------- | -------------------------------------------------------- |
| id            | UUID            | Уникальный идентификатор                                 |
| project_id    | FK → Project    | Проект                                                   |
| domain_name   | String          | Доменное имя (example.com)                               |
| provider      | Enum            | Reg.ru, GoDaddy, Beget, Other                            |
| account_id    | FK → Credential | Аккаунт провайдера                                       |
| purchase_date | Date            | Дата покупки                                             |
| expiry_date   | Date            | Дата истечения                                           |
| renewal_cost  | Decimal         | Стоимость продления                                      |
| client_charge | Decimal         | Сумма, которую платит клиент (может быть > renewal_cost) |
| auto_renew    | Boolean         | Автопродление включено                                   |
| status        | Enum            | Active, Expiring Soon, Expired, Transferred              |
| notes         | Text            | Заметки                                                  |

**Связи:**

- Domain → one Project
- Domain → one Credential (аккаунт провайдера)
- Domain may generate: Invoice Card for client + Expense + renewal task

---

### 2.17. Employee (Сотрудник)

| Поле                  | Тип             | Описание                                                   |
| --------------------- | --------------- | ---------------------------------------------------------- |
| id                    | UUID            | Уникальный идентификатор                                   |
| first_name            | String          | Имя                                                        |
| last_name             | String          | Фамилия                                                    |
| primary_seat_id       | FK → Seat       | Основная функция, вычисляется из active primary assignment |
| primary_department_id | FK → Department | Основной отдел, вычисляется из primary seat                |
| level                 | Enum            | Junior, Middle, Senior, Lead, Head                         |
| email                 | String          | Email                                                      |
| phone                 | String          | Телефон                                                    |
| telegram_id           | String          | Telegram ID                                                |
| work_schedule         | JSON            | Рабочий график                                             |
| status                | Enum            | Active, Probation, On Leave, Fired                         |
| hire_date             | Date            | Дата найма                                                 |

`role` и `department` не должны быть простыми scalar fields источника истины. Бизнес-функции сотрудника задаются через `Seat Assignment`.

**Связи:**

- Employee → many Seat Assignments
- Employee → many Projects (как seller, PM, dev)
- Employee → many Tasks
- Employee → many Bonus Entries
- Employee → many Compensation Profiles
- Employee → many Payroll Runs / Salary Lines
- Employee → many Credentials (доступ)

---

### 2.17.1. Department (Отдел)

Бизнес-направление компании.

| Поле              | Тип             | Описание                        |
| ----------------- | --------------- | ------------------------------- |
| id                | UUID            | Уникальный идентификатор        |
| name              | String          | Название отдела                 |
| parent_id         | FK → Department | Родительский отдел, если есть   |
| head_seat_id      | FK → Seat       | Seat руководителя отдела        |
| owner_employee_id | FK → Employee   | Текущий владелец / руководитель |
| status            | Enum            | Active, Archived                |
| kpi_policy_id     | FK → KPI Policy | KPI policy отдела, если есть    |

### 2.17.2. Seat (Место / функция)

Функция в компании, а не человек.

| Поле                       | Тип                  | Описание                      |
| -------------------------- | -------------------- | ----------------------------- |
| id                         | UUID                 | Уникальный идентификатор      |
| department_id              | FK → Department      | Отдел                         |
| title                      | String               | Название функции              |
| accountability             | Text                 | За что seat отвечает          |
| required_skills            | JSON                 | Требования / навыки           |
| level_range                | JSON                 | Допустимые уровни             |
| default_kpi_policy_id      | FK → KPI Policy      | KPI policy по умолчанию       |
| default_bonus_policy_id    | FK → Bonus Policy    | Bonus policy по умолчанию     |
| default_permission_role_id | FK → Permission Role | Техническая роль по умолчанию |
| status                     | Enum                 | Active, Vacant, Archived      |

### 2.17.3. Seat Assignment (Назначение на место)

Связь сотрудника с функцией.

| Поле           | Тип           | Описание                            |
| -------------- | ------------- | ----------------------------------- |
| id             | UUID          | Уникальный идентификатор            |
| seat_id        | FK → Seat     | Какая функция                       |
| employee_id    | FK → Employee | Кто занимает                        |
| allocation_pct | Decimal       | Процент занятости / ответственности |
| is_primary     | Boolean       | Основная функция сотрудника         |
| start_date     | Date          | Дата начала                         |
| end_date       | Date          | Дата окончания, если есть           |
| status         | Enum          | Active, Temporary, Ended            |

---

### 2.17.4. SOP Document (Стандартная операционная процедура)

Человеческое описание повторяемого процесса.

| Поле           | Тип             | Описание                                      |
| -------------- | --------------- | --------------------------------------------- |
| id             | UUID            | Уникальный идентификатор                      |
| title          | String          | Название SOP                                  |
| department_id  | FK → Department | Отдел                                         |
| owner_seat_id  | FK → Seat       | Seat, отвечающий за актуальность SOP          |
| purpose        | Text            | Цель                                          |
| input          | Text            | Что запускает процесс                         |
| output         | Text            | Что является результатом                      |
| body           | Text            | Шаги и описание                               |
| checklist_json | JSON            | Чеклист                                       |
| version        | String          | Версия                                        |
| review_date    | Date            | Когда пересмотреть                            |
| status         | Enum            | Draft, Review, Active, Needs Update, Archived |

### 2.17.5. Process Template (Шаблон процесса)

Исполняемая версия SOP.

| Поле               | Тип                   | Описание                               |
| ------------------ | --------------------- | -------------------------------------- |
| id                 | UUID                  | Уникальный идентификатор               |
| sop_document_id    | FK → SOP Document     | На какой SOP ссылается                 |
| trigger_type       | Enum                  | Manual, Event, Schedule                |
| trigger_config     | JSON                  | Настройки запуска                      |
| steps_json         | JSON                  | Шаги, владельцы, сроки, approvals      |
| task_blueprint_ids | FK[] → Task Blueprint | Какие задачи создаются, если применимо |
| status             | Enum                  | Draft, Active, Archived                |

### 2.17.6. Process Run (Запуск процесса)

Конкретный запуск процесса: onboarding, offboarding, monthly close, incident response.

| Поле                | Тип                   | Описание                                           |
| ------------------- | --------------------- | -------------------------------------------------- |
| id                  | UUID                  | Уникальный идентификатор                           |
| process_template_id | FK → Process Template | Шаблон процесса                                    |
| context_type        | Enum                  | Employee, Project, Product, Finance Period, Ticket |
| context_id          | UUID                  | ID связанной сущности                              |
| owner_employee_id   | FK → Employee         | Кто отвечает за конкретный запуск                  |
| status              | Enum                  | Open, In Progress, Waiting, Completed, Cancelled   |
| started_at          | DateTime              | Когда запущен                                      |
| due_at              | DateTime              | Дедлайн процесса                                   |
| completed_at        | DateTime              | Когда завершён                                     |

---

### 2.18. Partner (Партнёр)

| Поле            | Тип     | Описание                                                                |
| --------------- | ------- | ----------------------------------------------------------------------- |
| id              | UUID    | Уникальный идентификатор                                                |
| name            | String  | Имя / название                                                          |
| type            | Enum    | Regular (без договора), Premium (с договором)                           |
| direction       | Enum    | Inbound (передаёт нам заказы), Outbound (мы передаём им клиентов), Both |
| default_percent | Decimal | Стандартный % (30%)                                                     |
| contact_info    | JSON    | Телефон, email, messenger                                               |
| agreement_url   | String  | Ссылка на договор                                                       |
| status          | Enum    | Active, Inactive                                                        |
| notes           | Text    | Заметки                                                                 |

**Связи:**

- Partner → many Orders (referral deals)
- Partner → many Subscription Contracts (partner services)
- Partner → many Expenses (partner payouts)

---

### 2.19. Task (Задача)

Подробное описание в отдельном документе (05-Tasks). Здесь — ключевые поля.

| Поле                  | Тип             | Описание                                                  |
| --------------------- | --------------- | --------------------------------------------------------- |
| id                    | UUID            | Уникальный идентификатор                                  |
| title                 | String          | Название задачи                                           |
| primary_context_type  | Enum            | Основной контекст: Standalone / Product / Invoice и т.д.  |
| project_id            | FK → Project    | Проект (опционально)                                      |
| product_id            | FK → Product    | Продукт (опционально)                                     |
| extension_id          | FK → Extension  | Доработка (опционально)                                   |
| workspace_id          | FK → WorkSpace  | Work Space, в котором задача обычно живёт                 |
| creator_id            | FK → Employee   | Кто поставил                                              |
| assignee_id           | FK → Employee   | Исполнитель                                               |
| co_assignees          | FK[] → Employee | Соисполнители                                             |
| observers             | FK[] → Employee | Наблюдатели                                               |
| reviewer_id           | FK → Employee   | Кто принимает review/completion, если применимо           |
| workflow_status       | Enum            | Open, In Progress, Review, Completed, Deferred, Cancelled |
| priority              | Enum            | Critical, High, Normal, Low                               |
| sprint_id             | FK → Sprint     | Спринт (опционально, если workspace scrum-enabled)        |
| due_date              | Date            | Дедлайн                                                   |
| description           | Text            | Описание                                                  |
| completion_rules_json | JSON            | Условия, без которых задачу нельзя завершить              |
| has_chat              | Boolean         | Есть ли discussion thread                                 |
| created_at            | DateTime        | Дата создания                                             |
| completed_at          | DateTime        | Дата завершения                                           |

### 2.20. Work Space

`Work Space` — planning-сущность модуля `Tasks`. Она не заменяет задачу, а организует задачи в backlog, sprint, kanban и другие рабочие виды.

| Поле                | Тип      | Описание                                                          |
| ------------------- | -------- | ----------------------------------------------------------------- |
| id                  | UUID     | Уникальный идентификатор                                          |
| title               | String   | Название рабочего пространства                                    |
| type                | Enum     | PRODUCT_DELIVERY, EXTENSION_DELIVERY, STANDALONE_OPERATIONAL, ... |
| mode                | Enum     | KANBAN_ONLY, SCRUM_ENABLED                                        |
| context_entity_type | Enum     | С какой сущностью связан workspace                                |
| context_entity_id   | UUID     | Идентификатор связанной сущности                                  |
| settings_json       | JSON     | Настройки интерфейса, views, правил и ограничений                 |
| created_at          | DateTime | Дата создания                                                     |

### 2.21. Sprint

`Sprint` принадлежит `Work Space` и используется только в scrum-enabled пространствах.

| Поле         | Тип            | Описание                                  |
| ------------ | -------------- | ----------------------------------------- |
| id           | UUID           | Уникальный идентификатор                  |
| workspace_id | FK → WorkSpace | Пространство, которому принадлежит спринт |
| title        | String         | Название спринта                          |
| goal         | Text           | Цель спринта                              |
| status       | Enum           | Planning, Active, Closed                  |
| start_date   | Date           | Дата начала                               |
| end_date     | Date           | Дата окончания                            |
| created_at   | DateTime       | Дата создания                             |

---

## 3. Diagram: Entity Relationships

```
Contact ──1:N──► Project ──1:N──► Product ──1:1──► Order ──1:N──► Invoice ──1:1──► Payment
   │                │                                  │
   │                ├──1:N──► Extension ──1:1──► Order  ├──1:N──► Bonus Entry
   │                │                                  │
   │                ├──1:N──► Subscription ──1:N──► Invoice
   │                │
   │                ├──1:N──► Credential
   │                ├──1:N──► Domain
   │                ├──1:N──► Asset (Drive)
   │                ├──1:N──► Chat
   │                ├──1:N──► Support Ticket
   │                └──1:N──► Audit Log
   │
   └──1:N──► Company

Partner ──1:N──► Order (referral)
Partner ──1:N──► Subscription (partner service)
Partner ──1:N──► Expense (payouts)

Employee ──1:N──► Task
Employee ──1:N──► Bonus Entry
Employee ──N:M──► Project (roles: seller, PM, dev)
Employee ──N:M──► Credential (access)

Lead ──1:1──► Deal ──1:1──► Order
```

---

## 4. Поведенческое влияние справочников (List-Driven Behavior)

> Значения справочных полей — **не просто текстовые метки**. Они определяют
> поведение системы: обязательные поля, визуальное оформление, автоматические
> действия, валидацию и навигацию в разных модулях.

### 4.1 Архитектурный принцип

Каждый справочник (enum / SystemList) может влиять на **три уровня**:

| Уровень        | Описание                                | Пример                              |
| -------------- | --------------------------------------- | ----------------------------------- |
| **UI**         | Отображение, цвета, показ/скрытие полей | DealType=EXTENSION → синяя карточка |
| **Валидация**  | Обязательные поля зависят от значения   | ProductType=WEBSITE → нужен домен   |
| **Автоматика** | Триггеры, шаблоны, вычисления           | ProductType → набор авто-задач      |

### 4.2 Карта влияния по справочникам

#### Deal Type (PRODUCT, EXTENSION, MAINTENANCE, OUTSOURCE)

| Где влияет             | Как                                                                              |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Deal Card (Kanban)** | Цвет и оформление карточки зависят от типа                                       |
| **Deal → поля**        | `PRODUCT` → показывает Product Type; `EXTENSION` → показывает связку с продуктом |
| **Deal → Order**       | Тип заказа наследует тип сделки                                                  |
| **Starting (Product)** | Набор обязательных полей и стадий зависит от типа                                |
| **Stage Gates**        | _(будущее)_ Разные обязательные поля при переходе стадий для разных типов        |

#### Product Type (WEBSITE, MOBILE_APP, CRM, LOGO, SMM, SEO, OTHER)

| Где влияет                       | Как                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Auto-Tasks**                   | Шаблон задач при создании продукта зависит от типа (8 задач для WEB_APP vs 5 для DESIGN)        |
| **Starting → обязательные поля** | _(будущее)_ WEBSITE → нужен домен, хостинг; MOBILE_APP → нужны App Store/Play Store credentials |
| **Project Hub**                  | _(будущее)_ Иконка/визуал продукта зависит от типа                                              |

#### Lead Source / Marketing (MARKETING, SALES, PARTNER, CLIENT)

| Где влияет              | Как                                                                            |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Lead/Deal → подполя** | `SALES`/`MARKETING` → показывает «Where?» (канал: Instagram, Cold Call и т.д.) |
| **`PARTNER`**           | → показывает поиск партнёра, считает партнёрскую комиссию                      |
| **`CLIENT`**            | → показывает контакт-источник                                                  |
| **Бонусы**              | Процент бонуса продажника зависит от канала                                    |
| **Автоматика**          | _(будущее)_ Разные уведомления/действия в зависимости от канала                |

#### Payment Type (CLASSIC, SUBSCRIPTION)

| Где влияет         | Как                                               |
| ------------------ | ------------------------------------------------- |
| **Finance расчёт** | SUBSCRIPTION → годовая сумма = месяц × 12         |
| **Order Type**     | Влияет на тип создаваемого заказа                 |
| **Invoices**       | SUBSCRIPTION → ежемесячная авто-генерация Invoice |

### 4.3 Текущая реализация и подход

**Хранение:** Prisma enum в БД (типобезопасность + валидация) **+** SystemListOption
(UI labels, динамическое управление в Settings → Lists). Связь между ними — по
совпадению текстового кода (`code` = enum value).

**Статус:** Базовое UI-ветвление реализовано (цвета, показ полей). Глубокое
поведенческое влияние (обязательные поля по типу, автоматические действия по каналу)
— **бэклог Фаз C и D**.

---

## 5. Ключевые правила целостности данных

1. **Каждый Invoice обязательно привязан к Order ИЛИ Subscription.** Нет "свободных" счетов.
2. **Каждый Bonus Entry обязательно привязан к Order.** Даже micro-extension создаёт Order.
3. **Payment триггерит события:** смена статуса Order, создание Bonus Entry, создание Partner Payout.
4. **Tax-Free / Tax статус наследуется:** Order/Subscription → Invoice. Определяется один раз и не меняется.
5. **Credential encryption:** логин, пароль, API key, env_data шифруются на уровне поля (AES-256).
6. **Audit обязателен для:** Credentials (view + edit), Invoices, Payments, Bonus Entries, Access changes.
7. **Project статус вычисляется**, а не устанавливается вручную.
