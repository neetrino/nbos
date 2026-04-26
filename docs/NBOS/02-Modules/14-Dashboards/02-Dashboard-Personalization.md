# Dashboard Personalization

> NBOS Dashboard - персональный пульт пользователя, pinned actions, widgets и настройки отображения.

## Назначение

Каждый сотрудник использует NBOS по-разному. Seller чаще открывает deals и CRM chats, PM - products и tasks, Finance - invoices и salary, Owner - всё важное по бизнесу.

Поэтому Dashboard должен быть персонализируемым.

## Pinned Actions

`Pinned Actions` - это быстрые кнопки в верхней части Dashboard.

Пользователь может:

- закрепить действие;
- убрать действие;
- поменять порядок;
- открыть список доступных действий;
- сбросить к default layout по роли.

## Available Actions Drawer

Закрытый список всех доступных действий:

```text
Add action
  CRM
    New Lead
    Open Deals
    Open CRM Client Chats
  Delivery
    Open Product Board
    Open My Work Spaces
  Finance
    Open Invoices
    Open Salary Board
    Open Expense Board
  System
    Open Drive
    Open Credentials
    Open Calendar
```

Список фильтруется по правам пользователя.

## Default by role

Система может дать стартовый layout:

| Role / Seat | Default pinned actions                                         |
| ----------- | -------------------------------------------------------------- |
| Seller      | `New Lead`, `Open Deals`, `CRM Client Chats`, `Offers Pending` |
| PM          | `Product Board`, `My Work Spaces`, `Tasks Review`, `Calendar`  |
| Developer   | `My Tasks`, `My Work Spaces`, `Messenger`, `Credentials`       |
| Finance     | `Invoices`, `Subscriptions`, `Expense Board`, `Salary Board`   |
| Owner       | `Company Focus`, `Finance`, `Delivery Risks`, `Approvals`      |

Пользователь может изменить это под себя.

## Widget personalization

Виджеты можно:

- показать;
- скрыть;
- переместить;
- закрепить;
- заменить на другой виджет;
- свернуть в compact mode.

## User preferences model

```text
DashboardPreference
  user_id
  pinned_actions[]
  hidden_actions[]
  visible_widgets[]
  hidden_widgets[]
  widget_order[]
  compact_widgets[]
  default_dashboard_mode
  updated_at
```

## Admin defaults

Администратор может задавать default dashboard layout по:

- permission role;
- business seat;
- department;
- module.

Но персональные настройки пользователя имеют приоритет, если они не нарушают RBAC.

## Safety rules

- пользователь не может закрепить действие, на которое нет прав;
- если permission сняли, action/widget автоматически скрывается;
- если feature flag выключили, action/widget исчезает;
- если модуль недоступен, виджет показывает safe empty state;
- personal preferences не должны ломать loading Dashboard.

## Header boundary

Header не должен быть персональным пультом.

В header остаются только глобальные действия:

- search / quick switcher;
- notifications;
- messenger shortcut, если нужен;
- my account;
- session/user menu.

Все часто используемые кнопки создания и переходов живут в `Pinned Actions`.
