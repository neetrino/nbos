# Call Screen

> Модальное окно текущего звонка: карточка по центру, затемнённый blur-оверлей как у sheet. Не entity sheet и не toast.
>
> **Runtime:** app-shell Active Call Screen (centered modal). SSE `call.started` / `call.answered` / `call.finished`; snapshot via `GET /crm/calls/:id/screen` (includes `noteVersion`; while ringing/answered the client re-fetches so hangup is visible without SSE). Note after end (`PATCH /crm/calls/:id/note` with `expectedNoteVersion`; 409 keeps the local draft). Popup is not the source of call state.
>
> Продукт: [`../02-Modules/01-CRM/08-Calls-and-Telephony.md`](../02-Modules/01-CRM/08-Calls-and-Telephony.md).  
> Visual model шитов: [`10-Entity-Detail-Sheet-Standard.md`](10-Entity-Detail-Sheet-Standard.md) — к этому окну не применять.

## 1. Когда открывается

Только у одного сотрудника (правила в каноне Calls §4). Слушатель в app shell (layout / Topbar), не на `/messenger`.

| Событие                           | Окно                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| inbound `start` + redirect SIP    | Сразу, модальная карточка поверх текущего экрана                         |
| inbound без SIP                   | Не открывать                                                             |
| inbound answered (`op` = мой SIP) | Открыть / обновить, если ещё не открыто                                  |
| outbound из NBOS                  | Сразу у инициатора                                                       |
| `finish` / `end`                  | То же окно: статус, длительность, плеер, поле заметки. Не закрывать само |

Пользователь закрывает сам. Повтор того же `uid` не открывает второе окно.

## 2. Layout

Центрированная карточка. Имя, номер и статус — крупные, по центру. Contact и Deal — компактные карточки в стиле Deal board card. Project / Product — одна центральная строка без карточки. Recent calls — лента истории. Кнопки Open\* — вторичные, внизу слева.

```text
              [ dimmed / blurred overlay ]
        ┌─────────────────────────────────────┐
        │              [avatar]            X  │
        │     Incoming · Ringing              │
        │     Name (or New caller)            │
        │     +374…                           │
        ├──────────────────┬──────────────────┤
        │ Contact (card)   │ Deal (card)      │
        │ name headline    │ name headline    │
        │ company, phones  │ stage, amount    │
        ├──────────────────┴──────────────────┤
        │     Project · …    Product · …      │
        │ Recent calls (history timeline)     │
        ├─────────────────────────────────────┤
        │ After end: duration · player · note │
        │ Open Lead · Open Contact · Open Deal│
        └─────────────────────────────────────┘
```

Новый человек: Contact / Deal / Project пустые — не выдумывать. Показать номер и Lead.

## 3. Действия

- Закрыть окно.
- Открыть Lead / Contact / Deal в обычном sheet (окно можно оставить).
- После конца: сохранить заметку.
- Click-to-call из этого окна не нужен (звонок уже идёт). Кнопка «Позвонить» живёт на карточках.

## 4. Чего нет

- Toast / колокольчик вместо окна.
- Транскрипт в реальном времени.
- Управление трубкой ATS (hold / hangup) — трубкой управляет ATS, NBOS показывает контекст.
