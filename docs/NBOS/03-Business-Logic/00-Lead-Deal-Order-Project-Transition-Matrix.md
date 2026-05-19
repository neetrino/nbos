# Матрица переходов: Lead → Deal → Order → Project

> **Единая сводка** сквозных переходов между сущностями и модулями. Детальные правила, гейты и UI — в связанных канонических файлах ниже; при расхождении детальные модули и **Core Entities** имеют приоритет над этой таблицей как «карта».

**Связанные документы**

| Тема                                         | Файл                                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Воронка лидов, SQL → Deal                    | `02-Modules/01-CRM/02-Lead-Pipeline.md`                     |
| Воронка сделок, Deposit & Contract, Deal Won | `02-Modules/01-CRM/03-Deal-Pipeline.md`                     |
| Гейты стадий Deal и override Won             | `02-Modules/01-CRM/05-Deal-Stage-Gates-and-Won-Override.md` |
| Триггер Order/Project, Extension, иерархия   | `03-Business-Logic/02-Order-to-Delivery-Process.md`         |
| Точка входа Projects Hub по типу сделки      | `02-Modules/02-Projects-Hub/04-Project-Lifecycle.md`        |
| Полный narrative Lead-to-Cash                | `03-Business-Logic/01-Lead-to-Cash-Process.md`              |
| Сущности и связи                             | `01-Platform-Overview/03-Core-Entities-and-Data-Model.md`   |

---

## 1. Границы модулей (кто за что отвечает)

| Граница                | Слева                          | Справа                                               | Примечание                                                                        |
| ---------------------- | ------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| CRM intake             | Внешний мир / Marketing        | `Lead`, `Deal`                                       | Пайплайны и stage gates только в CRM                                              |
| CRM → Delivery handoff | `Deal` (терминал **Deal Won**) | `Order`, `Project`, `Product` / `Extension`, Finance | После Won операционная доставка — Projects Hub + Finance                          |
| Delivery ops           | —                              | `Product` / `Extension` lifecycle                    | `Starting → Development → QA → Transfer` → `Done` / `Cancelled`; см. Projects Hub |

`Lead` и `Deal` **не** входят в operational lifecycle Projects Hub; Hub начинается после создания delivery-единицы.

---

## 2. Lead Pipeline — переходы (внутри CRM)

| Из                               | В                     | Условие / триггер                                                             | Терминал                                                 |
| -------------------------------- | --------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| —                                | `New`                 | Создание лида (форма, мессенджер, ручной ввод)                                | Нет                                                      |
| `New`                            | `On Hold`             | Короткая пауза до активной обработки                                          | Нет                                                      |
| `On Hold`                        | `New`                 | Снятие паузы                                                                  | Нет                                                      |
| `New`                            | `Didn't Get Through`  | Попытка связи без успеха                                                      | Нет                                                      |
| `On Hold`                        | `Didn't Get Through`  | Как из New — после перехода действуют гейты стадии                            | Нет                                                      |
| `New` / `Didn't Get Through` / … | `Contact Established` | Контакт установлен                                                            | Нет                                                      |
| `Contact Established`            | `Qualification (MQL)` | Готовность к оценке качества                                                  | Нет                                                      |
| `Qualification (MQL)`            | `Quality Lead (SQL)`  | Критерии MQL→SQL выполнены                                                    | Нет                                                      |
| `Qualification (MQL)`            | `Frozen`              | Клиент не готов / отложено                                                    | Архив с возможной реактивацией                           |
| Любая рабочая стадия             | `SPAM`                | Нецелевой лид                                                                 | Да (без обратного перехода)                              |
| `Quality Lead (SQL)`             | **Создание `Deal`**   | Конвертация: обязательные поля (контакт, marketing block, тип услуги, Seller) | Новая сущность `Deal` на стадии **Start a Conversation** |

Порядок активных стадий и побочные ветки: см. схему в `02-Lead-Pipeline.md`.

---

## 3. Deal Pipeline — переходы (внутри CRM)

Линейная ветка успеха (рабочие стадии 1–7):

`Start a Conversation` → `Discuss What Is Needed` → `Send Offer` → `Get Answer` → `Deposit & Contract`

| Из                   | В                     | Условие (кратко)                                                                                                                                  |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Get Answer`         | `Send Offer`          | Клиент просит изменения КП                                                                                                                        |
| `Get Answer`         | `Deposit & Contract`  | Клиент согласен                                                                                                                                   |
| `Get Answer`         | `Failed`              | Отказ                                                                                                                                             |
| Любая стадия до Won  | `Failed`              | Проигрыш с причиной                                                                                                                               |
| `Deposit & Contract` | **`Deal Won`**        | Stage gate: первый invoice **оплачен** (Finance Director), договор; для PRODUCT/EXTENSION/OUTSOURCE — см. гейты в Deal Pipeline + Stage Gates doc |
| —                    | `Deal Won` (override) | Управляемый bypass по канону Stage Gates (CEO / Head of Sales)                                                                                    |

После **`Deal Won`** сделка **не двигается** колонками CRM по delivery; история ведётся по `Order`, продукту и Finance.

---

## 4. Триггер: Deal Won + первый платёж → Order и Project

Канонический триггер создания коммерческой и delivery-базы:

```text
Deal.status = Deal Won
  AND первый квалифицирующий Invoice оплачен (подтверждение Finance)
  → создаётся Order
  → поведение Project / Product / Extension зависит от Deal Type (ниже)
```

Источник формулировки: `02-Order-to-Delivery-Process.md`, `03-Deal-Pipeline.md` (создание Order при оплате первого invoice на Deposit & Contract).

---

## 5. Матрица по `Deal Type`: что создаётся после handoff

| Deal Type       | Order                                                    | Project                         | Product / Extension в Hub                                                                  | Примечание                                                                  |
| --------------- | -------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **PRODUCT**     | Создаётся                                                | Создаётся (новый)               | **Product** внутри проекта → Delivery Board с **Starting**                                 | Полный product flow                                                         |
| **EXTENSION**   | Создаётся                                                | **Не создаётся** (существующий) | **Extension** в существующем Project/Product                                               | Отдельная финансовая единица, тот же проект                                 |
| **MAINTENANCE** | По канону Deal: первый invoice **не обязателен** для Won | Не новый product delivery flow  | Subscription / billing в **Finance**; delivery-специфика — `04-Project-Lifecycle.md` § 1.3 | `deadline` = planned maintenance start; старт подписки — Subscription Board |

---

## 6. Projects Hub — после входа (кратко)

Для **Product** и **Extension** (активный delivery):

`Starting` → `Development` → `QA` → `Transfer` → терминал `Done` или `Cancelled`

`On Hold` — pause-status вне основной линейки (см. Order-to-Delivery и Projects Hub).

---

## 7. Сводная цепочка «сквозь границы» (reference)

```text
[Lead pipeline …] → SQL → создаётся Deal (стадия 1)
  → [Deal pipeline … стадии 2–7]
  → Deal Won + первый Paid invoice
      → Order
      → + Project + Product        (PRODUCT)
      → + Extension в существующем Project (EXTENSION)
      → + Subscription / Finance context     (MAINTENANCE)
  → [Projects Hub: Starting → … → Done/Cancelled]
  → [Finance: остатки оплат, подписки, бонусы — отдельные каноны]
```

---

## 8. Создание Deal без Lead

Основной вход остаётся **Lead (SQL) → Deal**. Дополнительно разрешён **прямой** сценарий: сделка создаётся без `leadId`, с обязательным контактом (`contactId`), именем сделки, блоком атрибуции **From / Where** (как у лида), аудитом `DEAL_CREATED` при наличии пользователя в запросе. Реализация: `POST /api/crm/deals`, `DealsService.create` + `deal-create-validation.ts`, UI — `CreateDealDialog` без `prefill.leadId`.
