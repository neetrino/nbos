# Clients Cleanup Register

> NBOS Platform — список мест, которые нужно зачистить или доработать при реализации нового канона Clients.

## 1. Runtime gaps

### C1. В базе и UI поле пока называется `role`

Текущий runtime использует `Contact.role` со значениями `CLIENT / PARTNER / CONTRACTOR / OTHER`.

Новое каноническое значение: это `contact_type`, а не процессная роль.

Нужно:

- либо переименовать поле в коде и БД в `contact_type`;
- либо оставить техническое имя `role`, но в UI и документации показывать как `Contact Type / Тип контакта`.

### C2. Нет отдельного Client Account

Это правильно. Не создавать новую ручную сущность `Client Account`, если нет отдельной бизнес-причины.

Нужно:

- строить клиентский профиль через связи Contact / Company с Deal, Project, Invoice, Subscription, Support;
- не дублировать данные Contact и Company в третьей сущности.

### C3. Client Portfolio описан, но не реализован полноценно

Сейчас карточка Contact показывает только базовые данные, компании и count по projects/leads/deals. Полноценного 360-view пока нет.

Нужно:

- реализовать computed endpoint / view для Client Portfolio;
- открыть Portfolio из Contact Card и Company Card;
- добавить finance, projects, subscriptions, support, order history, communication summary.
- добавить tabs: Overview / Projects / Finance / Subscriptions / Support / Communication / Files;
- реализовать context modes: Contact Portfolio и Company Portfolio;
- реализовать access mask для финансовых данных.
- реализовать Files tab как Drive Client Library, а не отдельное хранилище файлов внутри Clients.

### C4. Company имеет один primary contact

Текущая модель поддерживает `company.contactId`, но бизнесу нужен минимум:

- primary contact;
- billing contact, если отличается;
- дополнительные контакты компании / проекта.

Нужно:

- не заставлять сотрудников выбирать сложные роли вручную;
- добавить конкретные связи только там, где они реально нужны процессу.

### C5. Deal / Project контакты слишком простые

Сейчас Deal и Project имеют один основной `contactId`.

Нужно:

- сохранить основной контакт как быстрый сценарий;
- предусмотреть дополнительные контакты проекта;
- invoice/payment reminders должны брать billing contact из Company / invoice settings, а не общий `contact_type`.

### C6. Нет process-flow реализации

Канон процесса описан в `05-Clients-Process-Flow.md`, но runtime пока не гарантирует весь путь Lead → Contact → Company → Deal → Project → Client Portfolio.

Нужно:

- добавить dedupe-check при создании Contact из Lead / Deal;
- сделать Company обязательной перед Invoice / Order / Subscription;
- поддержать Company типа `Individual` для физлиц;
- добавить billing contact / invoice contact;
- реализовать Client Portfolio endpoint / view.

## 2. Documentation cleanup

### D1. Убрать смысл “role управляет процессом”

Во всех документах Clients `role` должен читаться как `contact_type`.

Не должно быть логики:
`Contact.role = Decision Maker / Billing / Technical`.

Если такие роли понадобятся, они должны жить как конкретные связи в CRM / Project / Finance.

### D2. Не смешивать Contact Card и Client Portfolio

Contact Card — карточка человека.

Client Portfolio — вычисляемый клиентский обзор, который может открываться из Contact или Company.

Карточка Contact может показывать краткую сводку, но не должна становиться единственным местом всей клиентской аналитики.

## 3. Implementation checklist

Этот раздел фиксирует, что нужно изменить в текущем runtime, чтобы код соответствовал канону Clients.

### I1. Database / Models

Текущее состояние:

- `Contact.role` существует как enum `CLIENT / PARTNER / CONTRACTOR / OTHER`;
- `Company.contactId` является единственным контактом компании;
- `Deal.contactId` является единственным контактом сделки;
- `Project.contactId` является единственным контактом проекта;
- отдельного `Client Account` нет.

Нужно:

- решить технически: переименовать `Contact.role` в `contact_type` или оставить DB-name `role`, но в API/UI называть `contactType`;
- добавить `Company.billingContactId`, если billing contact отличается от primary contact;
- предусмотреть дополнительные контакты Company / Deal / Project через отдельные link-модели или лёгкую связь, если это понадобится в v1;
- не создавать таблицу `ClientAccount`;
- не хранить Client Portfolio как таблицу.

Рекомендуемая модель для дополнительных контактов, если делаем сразу:

```
ClientContactLink
  id
  contact_id
  entity_type  // COMPANY / DEAL / PROJECT / INVOICE
  entity_id
  purpose      // GENERAL / BILLING / TECHNICAL / OTHER
  is_primary
  created_at
```

`purpose` не является обязательной бизнес-ролью. Это техническая подсказка для UI и notifications.

### I2. API

Нужно добавить или доработать:

- `GET /clients/contacts` — фильтр должен называться `contactType` в API/UI, даже если внутри мапится на `role`;
- `POST /clients/contacts` — default `contactType = CLIENT`;
- dedupe endpoint или service method перед созданием Contact из Lead / Deal;
- `GET /clients/portfolio/contact/:contactId`;
- `GET /clients/portfolio/company/:companyId`;
- `GET /clients/companies` — вернуть primary contact и billing contact;
- `POST/PATCH /clients/companies` — поддержать billing contact.

Portfolio API должен возвращать computed data, а не создавать новую запись.

### I3. UI — Contacts

Текущие места:

- `ContactSheet`;
- `CreateContactDialog`;
- `Contacts page`;
- `CONTACT_ROLES` constants.

Нужно:

- заменить label `Role` на `Contact Type`;
- оставить варианты `Client / Partner / Contractor / Other`;
- добавить кнопку `Open Client Portfolio`;
- показывать краткие counters, но не превращать Contact Card в полный Portfolio;
- при создании из CRM default должен быть `Client`;
- при поиске / фильтрах использовать текст `Contact Type`.

### I4. UI — Companies

Текущие места:

- `CompanySheet`;
- `CreateCompanyDialog`;
- `Companies page`.

Нужно:

- переименовать текущий `contact` в UI как `Primary Contact`;
- добавить `Billing Contact`, если отличается от Primary;
- добавить кнопку `Open Company Portfolio`;
- объяснять empty state: если billing contact не указан, используется primary contact;
- показывать Company как billing entity, а не как client account.

### I5. UI — CRM Deal

Текущие места:

- `CreateDealDialog`;
- `DealGeneralTab`;
- `DealInvoiceTab`.

Нужно:

- Deal должен иметь основной Contact;
- Company должна быть обязательна до invoice/order/won logic для платных проектов;
- при выборе Company показывать её tax status и billing contact summary;
- если Company отсутствует при переходе на этап, где она нужна, stage-gate popup должен попросить создать / выбрать Company;
- поле `Which Client?` для source client должно искать Contact, а не Client Account.

### I6. UI — Projects Hub / Delivery

Нужно:

- Project сохраняет main contact из Deal;
- Project сохраняет Company из Deal;
- добавить дополнительные Project Contacts, если нужно связать Samvel / технического человека;
- дополнительные contacts не требуют обязательного выбора роли;
- из Project можно открыть Contact Card и Client Portfolio.

### I7. Client Portfolio screen

Нужно реализовать:

- отдельный Portfolio route / screen или large sheet;
- context mode: `Contact Portfolio` и `Company Portfolio`;
- tabs: Overview / Projects / Finance / Subscriptions / Support / Communication / Files;
- access mask для финансовых данных;
- navigation links к исходным сущностям;
- empty states для Contact без Company, Company без billing contact, Portfolio без invoices / tickets.

### I8. Automation / Validation

Нужно:

- dedupe-check при создании Contact из Lead / Deal;
- stage-gate popup, если для invoice/order/won не хватает Company;
- fallback для financial reminders: billing contact → primary contact → deal/project contact;
- audit log для merge Contact и изменения Company billing data;
- не блокировать работу из-за отсутствия дополнительных контактов.

## 4. Accepted decisions

| Решение                                                            | Статус   |
| ------------------------------------------------------------------ | -------- |
| Client Profile создаётся автоматически через связи                 | Accepted |
| Contact Type используется для общего типа контакта                 | Accepted |
| Сложные роли не обязательны в v1                                   | Accepted |
| Manual override типа контакта разрешён в Contact Card              | Accepted |
| Billing / project / deal контекст определяется конкретными связями | Accepted |
| Client Portfolio имеет отдельный screen spec и tabs                | Accepted |
| Runtime cleanup должен покрыть DB / API / UI / validation          | Accepted |
