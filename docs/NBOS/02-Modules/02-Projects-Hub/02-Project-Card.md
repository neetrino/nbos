# Project Card

## Обзор

При открытии проекта пользователь попадает не в "одну огромную рабочую карточку", а в **Project Shell** — оболочку проекта как контейнера бизнеса.

`Project Card` должна показывать контекст проекта и давать вход в рабочие зоны:

- products;
- extensions;
- delivery board;
- finance;
- support;
- credentials;
- files / Drive libraries.

Главный принцип:

- основная повседневная работа команды идёт не на уровне `Project`, а на уровне `Product` и `Extension`;
- `Project Card` собирает обзор и навигацию.

---

## 1. Overview

### Основные поля

| Поле           | Описание                                                                  |
| -------------- | ------------------------------------------------------------------------- |
| Project Name   | Название бизнеса / бренда                                                 |
| Computed Views | В каких views проект сейчас виден: `Development`, `Maintenance`, `Closed` |
| Project Type   | White Label / Mix / Custom Code                                           |
| Contact        | Основной контакт                                                          |
| Company        | Юрлицо для биллинга                                                       |
| Seller         | Ответственный seller                                                      |
| PM             | Ответственный PM                                                          |
| Description    | Общий контекст проекта                                                    |
| Created At     | Дата создания                                                             |

### Основные виджеты

| Виджет                  | Что показывает                                                               |
| ----------------------- | ---------------------------------------------------------------------------- |
| Products                | Все продукты проекта с мини-статусами                                        |
| Extensions              | Последние/активные доработки                                                 |
| Delivery Snapshot       | Сколько карточек сейчас в `Starting / Development / QA / Transfer / On Hold` |
| Finance Snapshot        | Заказы, оплаты, подписки                                                     |
| Files Snapshot          | Важные Drive files: approved offers, handoff, delivery, finance docs         |
| Nearest Deadlines       | Ближайшие даты по delivery-сущностям                                         |
| Audit / Recent Activity | Последние ключевые события                                                   |

---

## 2. Products section

Это список всех `Product` внутри проекта.

### Карточка продукта в списке

| Поле           | Описание                                 |
| -------------- | ---------------------------------------- |
| Name           | Название продукта                        |
| Product Type   | Website, Mobile App, CRM и т.д.          |
| Current Stage  | `Starting / Development / QA / Transfer` |
| Work Status    | `Active / On Hold`                       |
| Resolution     | `Done / Cancelled / null`                |
| Deadline       | Дедлайн                                  |
| PM             | Ответственный PM                         |
| Tasks Snapshot | Открытые / все задачи                    |

### Поведение

- клик открывает рабочую карточку продукта;
- оттуда пользователь попадает в product-centric workspace;
- если продукт стоит на паузе, это видно сразу на списочной карточке.

---

## 3. Extensions section

Это список всех `Extension` внутри проекта.

### Канон

- extension всегда живёт внутри `Project`;
- extension всегда связан с одним основным `Product`;
- при открытии карточки нужно видеть и сам extension, и к какому продукту он относится.

### Карточка extension в списке

| Поле           | Описание                                 |
| -------------- | ---------------------------------------- |
| Name           | Название доработки                       |
| Linked Product | К какому продукту относится              |
| Current Stage  | `Starting / Development / QA / Transfer` |
| Work Status    | `Active / On Hold`                       |
| Resolution     | `Done / Cancelled / null`                |
| Deadline       | Дедлайн                                  |
| Order          | Ссылка на связанный order                |

### Визуальный принцип

- `Product` cards — default color
- `Extension` cards — orange

Этот же принцип должен соблюдаться и в delivery board.

---

## 4. Delivery Board entry point

У проекта должен быть явный вход в отдельную `Delivery Board`.

Это не таб "все данные проекта подряд", а отдельная operational zone, где живут карточки:

- `Product`
- `Extension`

На board:

- работают стадии delivery;
- работает `On Hold`;
- работает drag-to-close в `Done / Cancelled`.

---

## 5. Finance section

Project Card может показывать финансовый агрегат проекта, но source of truth остаётся в Finance.

На уровне project shell допустимы:

- orders summary;
- invoices summary;
- subscription summary;
- last payment / next billing visibility.

Финансовые документы физически хранятся в Drive как File Assets, но видимость на Project Card зависит от Finance permissions. PM может видеть наличие документа без доступа к sensitive amount/proof, если политика доступа это требует.

---

## 5.1. Files / Drive section

Project Card показывает `Project Library` как агрегированный Drive view.

Внутри видны секции:

- Commercial / approved offers;
- Handoff;
- Product files;
- Extension files;
- Delivery;
- Support evidence;
- Client documents;
- Finance documents, если у пользователя есть доступ.

Project Card не должен физически копировать файлы между папками. Он показывает Drive File Assets, связанные с Project, Product, Extension, Deal, Client и Finance.

---

## 6. Subscription / Maintenance section

Если у существующих продуктов есть maintenance context, в проекте это должно быть видно отдельно от delivery board.

Важно:

- maintenance не является обычной стадией delivery lifecycle;
- это отдельный operational and billing context существующего продукта.

---

## 7. Role visibility

| Роль                      | Что важно на Project Card                                             |
| ------------------------- | --------------------------------------------------------------------- |
| CEO                       | Полная обзорная картина                                               |
| Finance Director          | Finance, subscriptions, order/payment context                         |
| Seller                    | Коммерческий и handoff контекст без dev-операционки в глубину         |
| PM                        | Products, extensions, delivery board, deadlines, credentials, support |
| Developer / Designer / QA | Свои delivery-контексты и рабочие сущности                            |

---

## 8. Итоговый принцип

`Project Card` должна отвечать на вопрос:

"Что происходит внутри этого бизнеса сейчас?"

А детальная рабочая деятельность должна происходить уже внутри:

- `Product workspace`
- `Extension card`
- `Delivery Board`
- `Product / Extension Library` в Drive
