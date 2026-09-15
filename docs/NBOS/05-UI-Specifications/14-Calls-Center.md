# Calls Center

> Общий журнал звонков. Не вкладка CRM и не Active Call Screen.
>
> Продукт: [`../02-Modules/01-CRM/08-Calls-and-Telephony.md`](../02-Modules/01-CRM/08-Calls-and-Telephony.md).
> Окно текущего звонка: [`11-Call-Screen.md`](11-Call-Screen.md).

## 1. Назначение

Один список всех входящих и исходящих звонков по времени: кто кому звонил, когда, что сказали (запись + заметка). Owner видит всё. Остальные — по `CALLS_VIEW` / `CALLS_PLAY`.

## 2. Путь и навигация

- Путь: `/calls`
- Sidebar: **Calls**, рядом с Messenger / Calendar
- Право пункта меню: `CALLS.VIEW`
- Вкладки Calls на Lead / Deal / Contact / Product не заменяются этим экраном

## 3. Layout

```text
Calls
  newest first, grouped by day
  row: direction · employee → party · phone · time · duration · player · note
```

Подгрузка вниз. Фильтры по сотруднику / направлению — later.

## 4. Чего нет

- Транскрипт / AI
- Отдельный журнал в каждом отделе
- Правка заметки в списке (заметка после звонка остаётся в Active Call Screen)
