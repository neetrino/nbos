# System Lists

> NBOS Settings / Admin - справочники платформы и правила безопасного изменения списков.

## Назначение

`System Lists` - это место для управляемых списков, которые используются в разных модулях.

Примеры:

- Product Type;
- Product Category;
- Deal Type labels;
- Lead Source;
- Marketing Channel;
- Priority;
- On Hold Reason;
- Cancellation Reason;
- Support Category;
- Expense Category.

Список не должен быть просто таблицей `key/value`. У каждого списка должен быть владелец, правила безопасности и понимание, влияет ли он на бизнес-логику.

## Типы списков

### 1. Display-only list / Визуальный список

Можно безопасно менять:

- label;
- color;
- order;
- active/inactive.

Пример:

```text
Priority:
  Low
  Medium
  High
  Urgent
```

### 2. Business-bound list / Список, связанный с логикой

Код значения влияет на бизнес-процессы.

Пример:

```text
Deal Type:
  Product
  Extension
  Maintenance
  Outsource
```

Здесь нельзя свободно удалить или переименовать `code`, потому что от него зависят:

- CRM stage gates;
- invoice requirements;
- subscription behavior;
- partner payout rules;
- bonus policies;
- delivery card type.

### 3. System-protected list / Защищённый системный список

Из UI можно менять только безопасные параметры.

Нельзя менять:

- `code`;
- system meaning;
- required flags;
- automation binding.

Можно менять:

- label;
- color;
- sort order;
- archived/active, если нет активных зависимостей.

## Data model

Минимальная модель:

```text
SystemList
  key
  name
  owner_module
  protection_level
  description

SystemListOption
  list_key
  code
  label
  color
  sort_order
  is_active
  is_protected
  metadata
```

### Protection level

| Level              | Значение                              |
| ------------------ | ------------------------------------- |
| `DISPLAY`          | Можно редактировать label/color/order |
| `BUSINESS_BOUND`   | Code связан с бизнес-логикой          |
| `SYSTEM_PROTECTED` | Нельзя удалять/менять code из UI      |

## Правила изменения

### Label / Color / Order

Можно менять из UI, если у пользователя есть право:

```text
settings.system_lists.edit
```

### Code

`code` нельзя менять из обычного UI.

Если code был создан ошибочно, нужно:

- создать новый option;
- мигрировать зависимости;
- архивировать старый option;
- оставить audit.

### Delete

Удаление запрещено для защищённых и уже используемых options.

Вместо удаления:

```text
Deactivate -> hide from new forms -> keep historical data valid
```

### Add new option

Можно только если список разрешает пользовательское расширение.

Для business-bound списков добавление нового code требует:

- описания бизнес-смысла;
- проверки зависимых модулей;
- owner approval;
- audit event.

## UX

Экран `System Lists`:

- список list keys слева;
- справа options выбранного списка;
- быстрый поиск;
- drag-and-drop sort;
- color picker;
- active/inactive toggle;
- protected badge;
- предупреждение, если список влияет на бизнес-логику;
- audit tab по выбранному списку.

## Runtime правила

Модули не должны хранить произвольные строки, если значение является системным справочником.

Правильно:

```text
deal_type = PRODUCT
display label = Product
```

Неправильно:

```text
deal_type = "Product"
```

Бизнес-логика должна работать по stable code, а UI показывает label.

## Cleanup hints

Текущая реализация может разрешать create/delete/update для `SystemListOption`. Нужно усилить защиту:

- protected metadata;
- запрет удаления используемых options;
- audit изменений;
- запрет изменения code для protected options;
- owner_module;
- предупреждения в UI.
