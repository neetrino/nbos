# Clients Process Flow

> Канон рабочего процесса: как Contact, Company и Client Portfolio появляются в реальной работе NBOS.

## Назначение

Этот документ нужен, чтобы команда одинаково понимала, где создаётся человек, где создаётся юридическая сущность, когда появляется клиентский профиль и как данные переходят из CRM в Projects Hub и Finance.

Главное правило: сотрудник не создаёт `Client Account` вручную. Он создаёт или выбирает `Contact` и `Company`, а клиентский профиль появляется автоматически через связи.

---

## 1. Общий путь

```
Lead
  ↓ qualification / SQL
Contact
  ↓ Deal creation
Deal + Company
  ↓ Deal Won
Project + Product / Extension
  ↓ financial and delivery links
Invoices / Subscriptions / Support / Client Services
  ↓ aggregation
Client Portfolio
```

---

## 2. Этап 1 — Lead

Lead хранит первичную заявку и разговор до момента, когда понятно, что с человеком нужно работать дальше.

На Lead могут быть временные контактные данные:

- имя;
- телефон;
- email;
- messenger;
- source / marketing fields;
- заметки разговора.

Lead сам по себе ещё не обязан быть полноценным Contact, если это спам, дубль или неквалифицированный запрос.

### Когда Lead превращается в Contact

Contact создаётся или привязывается, когда Lead становится достаточно качественным для дальнейшей работы:

- Lead переведён в SQL;
- создаётся Deal;
- Seller вручную решает сохранить человека в клиентскую базу.

Перед созданием Contact система делает dedupe-check:

- телефон;
- email;
- имя + фамилия с предупреждением.

Если найден похожий Contact, Seller выбирает:

- привязать Lead к существующему Contact;
- создать новый Contact, если это другой человек.

---

## 3. Этап 2 — Contact

Contact — это человек. Он может быть клиентом, партнёром, подрядчиком или другим типом контакта.

Обязательный минимум:

- first name;
- last name;
- phone;
- contact_type.

Default `contact_type`:

- из CRM / Deal / Project / Company → `Client`;
- из Partners → `Partner`;
- внешний исполнитель → `Contractor`;
- неизвестный / служебный случай → `Other`.

`contact_type` нужен для фильтров и общего понимания. Он не должен решать бизнес-логику стадий.

---

## 4. Этап 3 — Company

Company создаётся, когда появляется биллинговый контекст: кому выставлять счёт и с какими реквизитами работать.

Company может быть:

- юридическое лицо;
- ИП;
- физлицо.

Если клиент работает как физлицо, всё равно создаётся Company типа `Individual`, чтобы Finance мог одинаково привязывать Invoice к billing entity.

### Когда Company обязательна

Company обязательна до:

- создания Invoice;
- Deal Won для платного проекта;
- создания Order;
- запуска Subscription;
- оформления Client Service Record, если за него клиент должен платить.

### Минимальные поля Company

| Поле                                  | Правило                                           |
| ------------------------------------- | ------------------------------------------------- |
| name                                  | Обязательно                                       |
| type                                  | Legal / Sole Proprietor / Individual              |
| tax_status                            | Tax / Tax-Free                                    |
| primary_contact                       | Основной контакт компании                         |
| billing_contact                       | Необязательно, если отличается от primary_contact |
| tax_id / legal_address / bank_details | По правилам Company и Finance                     |

---

## 5. Этап 4 — Deal

Deal связывает продажу с человеком и биллинговой сущностью.

Минимальные связи:

- `deal.contact` — основной контакт сделки;
- `deal.company` — компания / биллинговая сущность, если сделка платная;
- `deal.source_contact` — если источник сделки существующий клиент;
- `deal.source_partner` — если источник партнёр.

Сотрудник не выбирает сложную роль контакта. Он просто выбирает, где этот Contact используется.

### Дополнительные контакты

Если в сделке участвует несколько людей клиента, они могут быть добавлены как дополнительные contacts. В v1 это может быть простой список связанных Contact без обязательной роли.

Если нужно явно понимать финансового человека, используется `billing_contact` в Company / Invoice settings, а не общий `contact_type`.

---

## 6. Этап 5 — Deal Won

После Deal Won система создаёт или связывает delivery и finance сущности.

Для Product / Extension / Outsource:

- создаётся или обновляется Project;
- создаётся Product или Extension;
- создаётся Order;
- создаётся Invoice или Subscription flow по правилам CRM / Finance;
- связи Contact и Company передаются в Project / Product / Order / Invoice.

Для Maintenance:

- Maintenance Deal связан с уже существующим Product;
- после Won создаётся Pending Subscription;
- Company и Contact берутся из основного Product / Project, если не требуется override.

---

## 7. Этап 6 — Project и Product

Project хранит бизнес / бренд клиента.

Product или Extension хранит конкретную delivery-работу.

Контакты в Project:

- основной контакт проекта берётся из Deal;
- Company берётся из Deal;
- дополнительные контакты могут быть добавлены вручную;
- billing contact берётся из Company / Finance settings.

Если сотрудник добавляет нового человека уже во время проекта, система создаёт или находит Contact и связывает его с Project. Это автоматически делает его видимым в клиентском контексте, но не требует выбора сложной роли.

---

## 8. Этап 7 — Invoice, Subscription, Support, Client Services

Все соседние модули используют Contact и Company как источник клиентского контекста.

### Finance

Invoice всегда должен быть привязан к Company. Юридические и налоговые данные берутся из Company.

Кому отправлять финансовые напоминания:

- сначала billing contact / invoice contact;
- если его нет — primary contact Company;
- если его нет — deal/project main contact.

### Subscriptions

Subscription связана с Project / Product / Company. Client Portfolio показывает подписки через эти связи.

### Support

Support Ticket может быть связан с Contact, Project и Product. Если тикет пришёл от нового человека клиента, Contact создаётся или привязывается и попадает в клиентскую историю.

### Client Services

Domain / Hosting / License / Account services связываются с Project / Product / Company. Если по ним создаются Invoice или Expense, они также видны в Client Portfolio.

---

## 9. Этап 8 — Client Portfolio

Client Portfolio появляется автоматически, когда Contact или Company имеют связи с клиентскими объектами.

### Portfolio от Contact

Показывает всё по человеку:

- все компании;
- все проекты;
- все сделки;
- все счета;
- все подписки;
- все тикеты;
- всю клиентскую историю, к которой у пользователя есть доступ.

### Portfolio от Company

Показывает только данные конкретной billing entity:

- проекты этой Company;
- invoices этой Company;
- subscriptions этой Company;
- client services этой Company;
- финансовую историю именно этого юрлица.

---

## 10. Пример InvestOn

### Участники

| Человек / Компания | Что это                                  |
| ------------------ | ---------------------------------------- |
| Anna               | Человек, который написал в CRM           |
| Tigran             | Человек, который отвечает за оплату      |
| Samvel             | Человек, который даёт технические данные |
| InvestOn LLC       | Юридическая / биллинговая сущность       |

### Процесс

1. Anna пишет в messenger и появляется Lead.
2. Seller квалифицирует Lead как SQL.
3. Система проверяет Contact по телефону / email.
4. Если Anna не найдена, создаётся `Contact: Anna`, `contact_type = Client`.
5. Seller создаёт Deal для сайта InvestOn.
6. В Deal выбирается основной контакт `Anna`.
7. Seller создаёт или выбирает `Company: InvestOn LLC`.
8. Company получает `primary_contact = Anna`.
9. Если оплатой занимается Tigran, он создаётся как Contact и указывается как `billing_contact`.
10. Если технические вопросы ведёт Samvel, он создаётся как Contact и добавляется в Project contacts после старта проекта.
11. После Deal Won создаются Project / Product / Order / Invoice.
12. Invoice берёт реквизиты из InvestOn LLC.
13. Финансовые напоминания идут через billing contact Tigran, если он указан.
14. Client Portfolio от Anna показывает все её связи.
15. Client Portfolio от InvestOn LLC показывает только проекты и финансы этой компании.

---

## 11. Validation gates

| Момент                               | Что должно быть заполнено                                           |
| ------------------------------------ | ------------------------------------------------------------------- |
| Lead → Contact                       | Имя, телефон или email, contact_type                                |
| Deal creation                        | Основной Contact                                                    |
| Deal stage before paid/invoice logic | Company для платных проектов                                        |
| Invoice creation                     | Company, tax_status, amount, due date                               |
| Deal Won                             | Company, Contact, required CRM fields, Finance rules                |
| Project start                        | Project, Product / Extension, main contact, deadline where required |

Если обязательного поля нет, система должна открывать popup с недостающими полями, как в CRM stage-gates.

---

## 12. Что не делаем

Не создаём отдельный `Client Account`, который дублирует Contact и Company.

Не заставляем сотрудников выбирать сложные роли для каждого контакта.

Не используем `contact_type` как бизнес-правило для переходов стадий.

Не смешиваем юридические данные Company с персональными данными Contact.

Не храним Client Portfolio как отдельную editable-сущность.

---

## 13. Accepted decisions

| Решение                                                                              | Статус   |
| ------------------------------------------------------------------------------------ | -------- |
| Contact создаётся из Lead / Deal / Project только после dedupe-check                 | Accepted |
| Company обязательна для Invoice / Order / Subscription                               | Accepted |
| Company типа Individual используется для физлиц                                      | Accepted |
| Billing contact задаётся в Company / Invoice settings, а не через общий contact_type | Accepted |
| Client Portfolio появляется автоматически через связи                                | Accepted |
| Дополнительные контакты проекта можно добавлять без сложных ролей                    | Accepted |
