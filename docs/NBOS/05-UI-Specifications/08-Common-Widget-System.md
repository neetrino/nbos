# Common Widget System

> NBOS page-level widget infrastructure для desktop и tablet рабочих экранов. Система позволяет модулям добавлять reusable, movable и collapsible widgets без тяжёлого no-code конструктора.

## Назначение

В NBOS есть много операционных страниц, где пользователю нужен персональный рабочий вид:

- карточки проектов и продуктов;
- CRM и Finance module dashboards;
- Delivery, Support и Tasks workspaces;
- Employee / Company overview;
- будущие module-owned control panels.

`Common Widget System` даёт единый UI-фундамент для таких страниц:

```text
Page / Module
  WidgetZone
    WidgetRegistry
    WidgetShell
    WidgetComponent
    LocalWidgetPreferences
```

Цель: чтобы разработчик мог быстро объявить нужные widgets в коде, а пользователь мог удобно настроить их порядок и компактность на больших экранах.

## Главный принцип

```text
Widgets = page-owned UI blocks.
Not BI builder.
Not no-code page editor.
Not Reports replacement.
```

Модуль может отдавать widgets для своей страницы, но система widgets не владеет бизнес-логикой. Данные остаются в source module, API projection или page query.

## Device Scope

### Поддерживаем

- Desktop workspaces.
- Tablet layouts, если ширины достаточно для полезного движения карточек и compact mode.

### Не делаем в MVP

- Phone widget editing, drag-and-drop layout, resize controls и widget library interactions.

Причина:

```text
На телефоне movable dashboard-style widgets чаще замедляют работу,
чем помогают пользователю.
```

Для phone screens страницы должны использовать обычный responsive layout. Controls для drag, resize и widget customization скрываются.

## Что может пользователь

На страницах, где включены widgets, пользователь может перемещать, сворачивать, скрывать и возвращать widgets, включать compact mode, сбрасывать default layout и иметь отдельные desktop/tablet layouts.

Первую версию лучше делать без сложного resize UX. Resize можно добавить позже только там, где он реально нужен.

## Non-Goals

`Common Widget System` не должен превращаться в custom chart builder, full analytics designer, no-code page builder, замену `Reports / Analytics`, cross-module business logic layer, mobile dashboard editor или real-time engine для каждой карточки.

Тяжёлая аналитика, exports, period comparisons и scheduled reports остаются в `Reports / Analytics`.

## Widget Anatomy

Каждый widget описывается через `WidgetDefinition`:

```text
WidgetDefinition
  id
  title
  description
  moduleOwner
  component
  defaultSize
  supportedBreakpoints
  requiredPermissions
  featureFlag
  defaultVisible
  defaultCollapsed
  allowCompactMode
```

Каждый widget рендерится внутри общего `WidgetShell`:

```text
WidgetShell
  header
    title
    description / meta
    optional icon
    actions
    collapse control
    compact control
  body
    loading state
    empty state
    error state
    content
```

`WidgetShell` отвечает за визуальную консистентность: spacing, border, header actions, loading, empty и error states. `WidgetComponent` отвечает только за content.

## Widget Registry

Widgets регистрируются страницей или модулем, которому они принадлежат.

Пример:

```text
ProjectCardWidgets
  projectOverview
  projectTasks
  projectFinanceSummary
  projectFiles
  projectQuickActions
```

Страница передаёт свой registry в `WidgetZone`. Это сохраняет ownership:

- Project widgets остаются в Projects Hub;
- CRM widgets остаются в CRM;
- Finance widgets остаются в Finance;
- shared shell/layout behavior остаётся в common UI.

## Widget Zone

`WidgetZone` — reusable поверхность страницы, которая даёт:

- desktop/tablet grid layout;
- drag-and-drop ordering;
- optional compact layout;
- collapse state;
- hidden widget handling;
- reset-to-default;
- local preference persistence;
- safe rendering boundary для каждого widget.

Каждая страница обязана иметь стабильный `pageId`.

```text
pageId examples:
  dashboard.main
  projects.card
  crm.dashboard
  finance.dashboard
  support.dashboard
```

## Layout Rules

### Desktop

Desktop — основной режим для widgets:

- multi-column grid;
- drag-and-drop reorder;
- optional width presets, если нужны;
- visible customization controls;
- widget library drawer/panel.

### Tablet

Tablet поддерживаем проще:

- меньше колонок;
- drag-and-drop только если это удобно;
- compact mode разрешён;
- resize обычно не нужен.

### Phone

Phone screens не должны показывать widget layout editing.

Допустимое поведение на phone:

- обычный responsive content страницы;
- fixed vertical stack только если страница уже построена на widgets;
- скрытые drag, resize, widget library и advanced customization controls.

## Local Preferences

MVP хранит page-level widget preferences локально.

Storage key:

```text
nbos.widgets.{userId}.{pageId}.{breakpoint}
```

Stored values:

```text
WidgetLayoutPreference
  widgetOrder[]
  hiddenWidgetIds[]
  collapsedWidgetIds[]
  compactWidgetIds[]
  sizeByWidgetId
  updatedAt
```

Локальное хранение выбрано специально: для page-level настройки это достаточно просто и не требует backend-синхронизации в первой версии.

Позже можно добавить server sync без изменения `WidgetDefinition` и page registries.

## Permissions And Feature Flags

Каждый widget фильтруется до рендера:

- required permissions;
- role / seat availability;
- feature flags;
- module availability;
- entity access для entity-scoped widgets.

Если permission сняли, widget исчезает из visible layout и из widget library.

Local preferences никогда не могут обходить RBAC.

## Failure Isolation

Один widget не должен ломать всю страницу.

Обязательное поведение:

- widget-level loading state;
- widget-level empty state;
- widget-level error state;
- safe retry action, если полезно;
- no full-page crash из-за одного widget.

Это особенно важно для страниц, которые собирают данные из нескольких модулей.

## Relationship To Dashboard

Dashboard остаётся персональным Control Center:

```text
Dashboard = action center / пульт управления.
Reports = deep analytics.
Common Widget System = reusable UI infrastructure.
```

Dashboard может использовать `WidgetShell`, `WidgetRegistry` и `WidgetZone`, но у Dashboard остаётся свой канон: pinned actions, priority feed и mini analytics.

`Common Widget System` не заменяет Dashboard personalization. Он даёт Dashboard и module pages общий, аккуратный foundation для widgets.

## Implementation Order

Рекомендуемый порядок:

1. Создать `WidgetShell` с loading, empty, error, collapse и compact states.
2. Создать `WidgetDefinition` и page-owned registries.
3. Создать `WidgetZone` для desktop layout.
4. Добавить local preference persistence по `pageId`.
5. Добавить tablet layout rules.
6. Добавить простую widget library для возврата hidden widgets.
7. Подключить систему сначала к одной low-risk странице.
8. Переиспользовать её в Dashboard / module dashboards там, где это подходит.

Не начинать со сложного grid builder. Начинать с надёжного shell, стабильного registry и простого reorder/collapse behavior.

## Acceptance Criteria

Page-level widget implementation считается готовым, если:

- widgets объявлены в коде через registry;
- страница рендерит default layout без saved preferences;
- desktop users могут reorder и collapse widgets;
- tablet layout остаётся удобным;
- phone customization controls скрыты;
- local preferences переживают reload;
- hidden widgets можно вернуть;
- permission changes не могут показать запрещённые widgets;
- один broken widget не ломает страницу;
- у страницы остаётся понятный non-widget responsive layout.
