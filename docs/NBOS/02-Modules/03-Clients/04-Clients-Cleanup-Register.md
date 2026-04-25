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

## 3. Accepted decisions

| Решение                                                            | Статус   |
| ------------------------------------------------------------------ | -------- |
| Client Profile создаётся автоматически через связи                 | Accepted |
| Contact Type используется для общего типа контакта                 | Accepted |
| Сложные роли не обязательны в v1                                   | Accepted |
| Manual override типа контакта разрешён в Contact Card              | Accepted |
| Billing / project / deal контекст определяется конкретными связями | Accepted |
