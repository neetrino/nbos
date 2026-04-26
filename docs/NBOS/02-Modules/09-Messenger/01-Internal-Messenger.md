# Internal Messenger

`Internal Messenger` - это зона только для команды Neetrino. Здесь нельзя писать клиенту. Все чаты в этой зоне считаются внутренними даже если они связаны с клиентским Project или Deal.

## Вкладки

| Tab                       | Что показывает                                         | Основной пользователь       |
| ------------------------- | ------------------------------------------------------ | --------------------------- |
| `All`                     | Иерархический обзор всех внутренних чатов с контекстом | CEO, Owner, PM              |
| `Project General`         | Общие чаты проектов                                    | CEO, PM, Seller             |
| `Deal Chats`              | Внутренние чаты сделок                                 | Seller, CEO, Head of Sales  |
| `Product Chats`           | Основные рабочие чаты продуктов                        | PM, Developer, Designer, QA |
| `Task Chats`              | Чаты задач, чаще для ответа на сообщения               | Все исполнители             |
| `Favorites / Collections` | Личные быстрые наборы чатов                            | Все                         |

Рабочие вкладки должны показывать сразу список чатов. Без обязательного раскрытия дерева.

## All tab

`All` нужен для навигации по полной структуре:

```text
Project: Marco.am
  General / Project Room
  Sales & Deal
    Deal #123 Product Website
    Deal #145 Extension
  Products
    Website Delivery
    CRM Delivery
  Task Threads
    Task #55 Fix payment bug
    Task #80 Prepare transfer
```

Это обзор, а не основной ежедневный сценарий. В daily work пользователь должен открыть нужный tab и сразу нажать на чат.

## Project General chat

`Project General` создаётся один раз на Project.

Используется для:

- общих вопросов по всему Project;
- координации между Seller, PM, CEO и другими участниками;
- решений, которые касаются нескольких Products внутри Project;
- обсуждений, которые не должны теряться внутри конкретного Product или Task.

Не используется для ежедневной разработки конкретного Product. Для этого есть `Product Chat`.

## Deal Chat

`Deal Chat` - внутренний чат сделки.

Используется для:

- pre-sale discussion;
- обсуждения оффера;
- вопросов Seller, CEO, Head of Sales;
- подготовки к Deal Won;
- внутренних комментариев, которые клиент не должен видеть.

Важно: `Deal Chat` не является клиентским CRM conversation. Реальная переписка с клиентом находится во `External Messenger -> CRM Inbox`.

## Product Chat

`Product Chat` - главный рабочий чат по Product.

Канон:

- у каждого Product один основной internal Product Chat;
- Development и Maintenance не разделяются на разные чаты по умолчанию;
- Extension обсуждается в Product Chat, если относится к этому Product;
- если Extension редкий и затрагивает несколько Products, он всё равно может быть привязан к одному главному Product, а остальные связи показываются контекстом.

Почему так:

- команда разработки 99% времени работает именно в Product context;
- меньше чатов значит меньше путаницы;
- после разработки тот же чат продолжает жить для Maintenance;
- история продукта остаётся в одном месте.

Внутри Product Chat должны быть быстрые context links:

- открыть Product card;
- открыть Project;
- открыть related Deals;
- открыть Work Space;
- открыть Tasks;
- открыть Drive Product Library;
- открыть Support tickets;
- открыть Subscriptions / Finance context, если доступно.

## Task Chats

`Task Chat` - discussion stream внутри задачи.

Канон поведения:

- писать в Task Chat обычно начинают из Task card;
- в Messenger вкладка `Task Chats` нужна в первую очередь для ответа на непрочитанные task messages;
- Task Chat создаётся лениво, при первом сообщении или первом явном открытии chat panel в задаче;
- закрытие задачи не удаляет chat history;
- закрытые Task Chats можно скрывать из active list, но они остаются доступными из Task card.

Карточка Task Chat в списке должна показывать:

- название задачи;
- связанный Project / Product / Deal / Work Space;
- статус задачи;
- исполнителя;
- количество unread messages;
- быстрые действия `Open Task`, `Open Product Chat`, `Open Project`.

Визуально Task Chats должны отличаться, например зелёной task icon. Это помогает не путать task discussion с project/product/deal chats.

## Favorites / Collections

Каждый пользователь может создавать свои коллекции:

- `My active products`;
- `Important deals`;
- `This week`;
- `CEO watch`;
- `Finance urgent`;
- любые другие личные наборы.

Коллекция не меняет права доступа. Она только сохраняет быстрый список уже доступных пользователю conversations.

## Default tab

У пользователя должен быть личный default tab.

Примеры:

| Роль        | Default tab                              |
| ----------- | ---------------------------------------- |
| Seller      | `Deal Chats` или `External -> CRM Inbox` |
| PM          | `Product Chats`                          |
| Developer   | `Product Chats` или `Task Chats`         |
| Finance     | `External -> Finance Conversations`      |
| CEO / Owner | `All` или личная collection              |

Последний выбранный tab можно сохранять как пользовательскую настройку.
