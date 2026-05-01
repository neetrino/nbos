# Messenger Permissions and UX

Messenger должен быть быстрее, чем обходной путь через Telegram/WhatsApp. Если сотруднику нужно много кликов, он не будет использовать NBOS.

## Entry points

Рекомендуемая модель UI:

| Entry point       | Что открывает                                              |
| ----------------- | ---------------------------------------------------------- |
| `Internal Chat`   | Внутренний Messenger                                       |
| `External Chat`   | Клиентские/внешние conversations                           |
| Entity chat panel | Быстрый chat panel внутри Deal/Product/Task/Ticket/Invoice |

Internal/External можно показать как две разные кнопки или как один Messenger с жёстким zone switch. В любом случае пользователь должен мгновенно видеть, в какой зоне находится.

Идея правой вертикальной панели как в Bitrix24 допустима: она может дать быстрый доступ к Messenger, unread и recent chats без перегруза левого меню.

## Базовый layout

```text
[Zone: Internal | External]
[Tabs: Product Chats | Deal Chats | Task Chats | ...]

Left: flat conversation list
Center: message timeline
Right: context panel
```

Context panel показывает:

- linked entity;
- participants;
- files;
- tasks/actions;
- related conversations;
- permissions;
- external channel status, если это External.

## Плоские списки

В ежедневных вкладках список должен быть плоским:

- Product Chats: сразу список Products;
- Deal Chats: сразу список Deals;
- Task Chats: сразу список Tasks с unread;
- CRM Inbox: сразу список client conversations;
- WhatsApp Groups: сразу список project groups.

Иерархия допустима только в `All`, search и filters.

## External visual guardrails

External зона должна отличаться:

- цветом/лейблом;
- текстом `Client visible`;
- показом канала отправки;
- показом Contact/Company/Project;
- запретом отправки без права;
- audit log.

Если пользователь пишет во внешний чат, composer должен выглядеть иначе, чем internal composer.

## Conversation card

Conversation card должна показывать минимум:

- title;
- type;
- linked entity;
- last message preview;
- unread count;
- last activity;
- participants or channel;
- warning badge, если external/failed/urgent.

Для Task Chat дополнительно:

- task status;
- assignee;
- due date;
- button `Open Task`.

Для Product Chat дополнительно:

- Product type/category;
- Project;
- current delivery stage;
- deadline/hold badge, если есть.

## Default user preferences

Каждый пользователь может настроить:

- default zone;
- default tab;
- pinned conversations;
- muted conversations;
- personal collections;
- notification preferences;
- compact/full layout.

Система может предложить role defaults, но пользователь может менять их.

## Permissions model

Доступ к conversation даётся через:

1. прямое участие в conversation;
2. доступ к linked entity;
3. role-based permission;
4. manual invite;
5. ownership/head/CEO override.

External send permission должен быть отдельным от read permission. Можно видеть внешний чат, но не иметь права писать клиенту.

## Архивирование

Conversation не удаляется физически при закрытии Deal/Task/Product.

Возможные состояния:

| State      | Что значит                                      |
| ---------- | ----------------------------------------------- |
| `active`   | Показывается в рабочих списках                  |
| `muted`    | Не шумит уведомлениями                          |
| `archived` | Скрыт из active list, доступен из entity/search |
| `locked`   | История доступна, писать нельзя                 |

Например закрытый Task Chat может уйти в archived, но открываться из Task card.
