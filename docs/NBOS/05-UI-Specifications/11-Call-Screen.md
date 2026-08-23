# Call Screen

> Полноэкранное окно текущего звонка. Не sheet и не toast.
>
> **Runtime:** app-shell fullscreen Active Call Screen. SSE `call.started` / `call.answered` / `call.finished`; snapshot via `GET /crm/calls/:id/screen` (includes `noteVersion`). Note after end (`PATCH /crm/calls/:id/note` with `expectedNoteVersion`; 409 keeps the local draft). Popup is not the source of call state.
>
> Продукт: [`../02-Modules/01-CRM/08-Calls-and-Telephony.md`](../02-Modules/01-CRM/08-Calls-and-Telephony.md).  
> Visual model шитов: [`10-Entity-Detail-Sheet-Standard.md`](10-Entity-Detail-Sheet-Standard.md) — к этому окну не применять.

## 1. Когда открывается

Только у одного сотрудника (правила в каноне Calls §4). Слушатель в app shell (layout / Topbar), не на `/messenger`.

| Событие                           | Окно                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| inbound `start` + redirect SIP    | Сразу, полноэкранно                                                      |
| inbound без SIP                   | Не открывать                                                             |
| inbound answered (`op` = мой SIP) | Открыть / обновить, если ещё не открыто                                  |
| outbound из NBOS                  | Сразу у инициатора                                                       |
| `finish` / `end`                  | То же окно: статус, длительность, плеер, поле заметки. Не закрывать само |

Пользователь закрывает сам. Повтор того же `uid` не открывает второе окно.

## 2. Layout

```text
┌─────────────────────────────────────────────────────────────┐
│  IN / OUT · ringing | answered | ended                      │
│  +374… · display name or Incoming call +374…                │
├──────────────────────────────┬──────────────────────────────┤
│ Contact                      │ Deal                         │
│ name, company, phones        │ name, stage, amount          │
│ empty: «New caller»          │ empty: «No open deal»        │
├──────────────────────────────┼──────────────────────────────┤
│ Project / Product            │ Recent calls                 │
│ names or «Not linked»        │ last few on this phone       │
├──────────────────────────────┴──────────────────────────────┤
│ After end: duration · disposition · player · note           │
│ Open Lead · Open Contact · Open Deal                        │
└─────────────────────────────────────────────────────────────┘
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
