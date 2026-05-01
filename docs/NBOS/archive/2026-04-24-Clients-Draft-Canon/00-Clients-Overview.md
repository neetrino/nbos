# Clients — Обзор модуля

> NBOS Platform — клиентский master-data слой: люди, юридические лица и агрегированный клиентский контекст

## 1. Назначение

`Clients` отвечает за **клиентскую базу** NBOS: кто этот человек, через какое юридическое лицо он оплачивает работу, какие проекты и финансовые отношения уже связаны с ним.

Ключевой принцип:

- `Contact` — человек;
- `Company` — юридическое или биллинговое лицо;
- `Client Portfolio` — вычисляемый view по клиентскому контексту;
- `Project` — бизнес / бренд клиента и живёт в `Projects Hub`;
- `Deal` — продажа и живёт в `CRM`;
- `Invoice / Payment / Subscription` — деньги и живут в `Finance`.

`Clients` не продаёт, не доставляет проект и не ведёт финансы. Он хранит устойчивый клиентский контекст, который используют соседние модули.

Для stale-логики и плана зачистки см. `04-Clients-Cleanup-Register.md`.

---

## 2. Граница модуля

### Что входит в Clients

- карточки физических лиц (`Contact`);
- карточки биллинговых лиц (`Company`);
- связи Contact ↔ Company;
- ссылки на проекты, сделки, счета, тикеты и коммуникации;
- дедупликация контактов и компаний;
- клиентский 360-view (`Client Portfolio`);
- базовые настройки общения: preferred channel, language, notes.

### Что не входит в Clients

| Не входит                               | Где живёт           |
| --------------------------------------- | ------------------- |
| Lead pipeline и Deal pipeline           | `CRM`               |
| Project / Product / Extension lifecycle | `Projects Hub`      |
| Invoice, Payment, Subscription, Expense | `Finance`           |
| Support Ticket lifecycle                | `Support`           |
| Реальные сообщения и чаты               | `Messenger`         |
| Права доступа как policy engine         | `My Company / RBAC` |

---

## 3. Основные сущности

### 3.1. Contact

`Contact` = человек, с которым Neetrino общается.

Один `Contact` может быть:

- клиентом;
- партнёром;
- подрядчиком;
- другим внешним контактным лицом.

Канон:

- один человек не должен дублироваться как несколько Contact из-за разных каналов обращения;
- повторные лиды из Instagram, website, phone, referral должны привязываться к уже существующему Contact, если это тот же человек;
- у Contact может быть много Companies, Projects, Deals и Tickets.

### 3.2. Company

`Company` = биллинговое лицо, на которое выставляются счета.

Это может быть:

- legal entity;
- sole proprietor;
- individual.

Канон:

- Company не равна Project;
- Company не равна Contact;
- Company нужна для invoices, tax-status, реквизитов и финансовой истории;
- один Contact может иметь несколько Companies;
- одна Company может обслуживать несколько Projects, если один бизнес-владелец использует одно юрлицо для разных брендов.

### 3.3. Client Portfolio

`Client Portfolio` = вычисляемый view, а не отдельная таблица или новая бизнес-сущность.

Он собирает данные из:

- Contact;
- Company;
- Projects Hub;
- CRM;
- Finance;
- Support;
- Messenger activity.

Канон:

- Portfolio от `Contact` показывает все компании и проекты этого человека;
- Portfolio от `Company` показывает только контекст конкретного биллингового лица;
- Portfolio не должен становиться местом ручного редактирования исходных финансовых или delivery-данных.

---

## 4. Жизненный процесс клиента

### 4.1. Первый контакт из CRM

```
Lead -> SQL -> Contact -> Deal -> Company -> Deal Won -> Project / Order
```

При конвертации качественного лида:

1. система проверяет, есть ли уже `Contact` по телефону, email или другим сильным совпадениям;
2. если Contact найден, Lead привязывается к нему;
3. если Contact не найден, создаётся новый Contact;
4. Deal получает ссылку на Contact;
5. Company создаётся или выбирается до выставления первого invoice.

### 4.2. Биллинг-контекст

Company должна быть определена до того, как Finance выставит invoice.

Минимально обязательные данные:

- name;
- type;
- tax status;
- primary contact;
- tax / legal / bank details, если они требуются для выбранного type и tax status.

Tax status наследуется в `Order`, `Subscription` и `Invoice`, чтобы Finance не выбирал его вручную каждый раз.

### 4.3. Повторная продажа существующему клиенту

Для нового Product, Extension или Maintenance Deal seller должен:

1. выбрать существующий Contact;
2. выбрать Company для биллинга;
3. выбрать существующий Project / Product, если это Extension или Maintenance;
4. создать Deal с уже заполненным client context.

Это снижает дубли и сохраняет историю клиента в одном месте.

---

## 5. Stage Gates и правила данных

### Contact gate

Нельзя создать полноценный Deal без Contact.

Допускается Lead с сырым `contactName`, но переход в SQL / Deal должен привести к одному из вариантов:

- existing Contact selected;
- new Contact created.

### Company gate

Company не всегда нужна на самой ранней стадии sales conversation, но обязательна до invoice.

Перед созданием invoice должны быть выполнены условия:

- Company выбрана или создана;
- tax status задан;
- обязательные реквизиты заполнены по типу Company;
- primary Contact привязан.

### Deduplication gate

Перед созданием Contact или Company система должна показывать возможные дубли.

Жёсткая блокировка нужна только для сильных уникальных совпадений, где бизнес-риск выше удобства:

- одинаковый tax id у Company;
- точное совпадение нормализованного phone/email у Contact может быть warning, потому что бывают общие номера компании.

---

## 6. Интеграции с соседними модулями

### CRM -> Clients

- Lead conversion создаёт или переиспользует Contact.
- Deal всегда связан с Contact.
- Deal может быть связан с Company до invoice.
- Source contact / partner context остаётся в CRM/Partners, но отображается в клиентской истории.

### Clients -> Finance

- Company передаёт tax status и реквизиты в invoice flow.
- Finance видит Company-level outstanding balance и историю оплат.
- Изменение billing entity не переписывает старые invoices.

### Clients -> Projects Hub

- Project хранит ссылки на Contact и Company.
- Projects Hub показывает client context, но не редактирует финансовые реквизиты как основной владелец.

### Clients -> Support

- Ticket может быть привязан к Contact и через Project получать полный client context.
- Support видит нужную контактную информацию, но не полную финансовую картину, если роль не разрешает.

### Clients -> Messenger

- Messenger связывает коммуникации с Contact.
- Clients показывает историю коммуникаций как read-only activity context.

---

## 7. Права доступа

Базовый канон:

| Роль                      | Доступ                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| CEO                       | полный доступ ко всем client records и portfolio                                                                 |
| Seller                    | создание и редактирование Contact/Company в sales context, чтение клиентской истории по своим/доступным клиентам |
| Finance Director          | полный доступ к Company, tax, реквизитам и financial sections                                                    |
| PM                        | чтение client context по своим проектам, без лишних финансовых деталей                                           |
| Support                   | чтение контактных данных и support-context по доступным tickets/projects                                         |
| Developer / Designer / QA | только минимальный project-context, если нужен для работы                                                        |

Детальная матрица остаётся в `04-Roles-and-Access`.

---

## 8. Owner Decisions

| Решение                                                                                          | Статус  |
| ------------------------------------------------------------------------------------------------ | ------- |
| `Contact`, `Company` и `Project` — разные уровни, их нельзя объединять                           | OK      |
| `Company` является billing entity и наследует tax status в финансовые документы                  | OK      |
| `Client Portfolio` является вычисляемым view, а не отдельной editable сущностью                  | OK      |
| Один Contact может иметь много Companies и Projects                                              | OK      |
| Company может быть заменена для будущего биллинга, но старые invoices остаются на старой Company | OK      |
| Полная дедупликация и merge требуют отдельной реализации после canon/gap phase                   | PARTIAL |

---

## 9. Минимальный Implementation Backlog

Этот список не является задачей на немедленную реализацию; это ориентир для gap-анализа после утверждения канона.

| Item                                                      | Статус  |
| --------------------------------------------------------- | ------- |
| Contact/Company CRUD                                      | PARTIAL |
| Contact deduplication warnings                            | MISSING |
| Company tax id uniqueness / warning policy                | PARTIAL |
| Company tax status immutability / controlled override     | MISSING |
| Archive вместо hard delete для Contact/Company с историей | MISSING |
| Client Portfolio endpoint/view                            | MISSING |
| Company taxStatus filter в API                            | PARTIAL |
| Реальный update из frontend sheets вместо create-on-edit  | MISSING |
| Merge contacts / merge companies workflow                 | MISSING |
