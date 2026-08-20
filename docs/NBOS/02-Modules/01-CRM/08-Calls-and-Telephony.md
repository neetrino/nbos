# Calls and Telephony

> NBOS Platform — звонки как активность CRM, не отдельная воронка.
>
> **Статус:** канон Accepted (2026-08-20). Runtime: Call core Phase 1 (`AtsCallEvent` = Call, CRM attach inbound/outbound, `GET /crm/calls`). Окно, запись, исходящий callback и сверка history — следующий срез.
>
> Провайдер: ATS.am. Контракт API: [`../../06-Integrations/09-ATS-AM-Integration.md`](../../06-Integrations/09-ATS-AM-Integration.md).  
> Окно звонка (UI): [`../../05-UI-Specifications/11-Call-Screen.md`](../../05-UI-Specifications/11-Call-Screen.md).  
> Intake attach: [`07-Lead-and-Deal-Merge.md`](07-Lead-and-Deal-Merge.md).

## 1. Назначение

Заменить Bitrix-телефонию: когда нам звонят или мы звоним, сотрудник сразу понимает **кто** и **с чем связан**, звонок остаётся в истории, запись не теряется.

Лучше Bitrix за счёт одного экрана: Contact + открытый Deal + Project + Product, без прыжков по вкладкам.

**Call не воронка.** Это активность на Lead и (если человек уже есть) на Contact. Deal / Project / Product — контекст, не второе хранилище звонка.

## 2. Сущность Call

Один `uid` ATS = одна запись Call (runtime: выросший `AtsCallEvent`).

| Поле                                 | Смысл                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `uid`                                | Идемпотентность. Повтор webhook обновляет ту же строку.                  |
| направление                          | inbound / outbound (`calldirect`)                                        |
| номер                                | нормализованный `clid`                                                   |
| `leadId`                             | Lead обращения, если есть                                                |
| `contactId`                          | Contact, если уже существует (по телефону, включая extra `ContactPhone`) |
| `dealId` / `projectId` / `productId` | Контекст на момент звонка, не копия воронки                              |
| `responsibleEmployeeId`              | Кому `redirect_call` или кто начал исходящий                             |
| `answeredEmployeeId`                 | Кто взял трубку (`op` → `Employee.sipId`)                                |
| `note`                               | Заметка сотрудника после звонка                                          |
| `rate`                               | Оценка 0–5 с ATS, если пришла                                            |
| `recordingFileAssetId`               | Файл в Drive, не вечная ссылка ATS                                       |

**Contact на звонке не создаём.** Contact появляется позже (SQL / Clients), как у Meta DM.

## 3. Правила сущностей

| Ситуация                                | Lead                                                                                | Contact      | Что видит сотрудник                    |
| --------------------------------------- | ----------------------------------------------------------------------------------- | ------------ | -------------------------------------- |
| Новый номер, входящий или исходящий     | Создать (`source=MARKETING`, `sourceDetail=ATS`)                                    | Не создавать | Окно: номер + новый Lead               |
| Открытый не-SQL Lead с тем же телефоном | Привязать, не плодить                                                               | Как есть     | Окно по этому Lead + Contact если есть |
| Contact + открытый Deal                 | Новый Lead **нет**; звонок на исходный Lead сделки или открытый не-SQL Lead Contact | Уже есть     | Окно: Contact + Deal + Project/Product |
| Contact без открытого Deal              | Новый Lead уже с `contactId`                                                        | Уже есть     | Окно: Contact + новый Lead             |
| Повтор того же `uid`                    | Не второй Lead                                                                      | —            | Обновить Call                          |
| Только `finish`/`end` без `start`       | Lead не создавать                                                                   | —            | Событие в Call, без окна «начало»      |

Исходящий на новый номер создаёт Lead **в момент звонка** (не ждать hangup).

Merge / Связать: Call переезжает вместе с ATS-событиями на survivor / исходный Lead сделки (`07-Lead-and-Deal-Merge.md`).

## 4. Кто видит окно

Окно **не** всем селлерам.

| Событие                                                | Кому окно                                            |
| ------------------------------------------------------ | ---------------------------------------------------- |
| inbound `start` + известный SIP                        | Только сотрудник, чей `sipId` ушёл в `redirect_call` |
| inbound `start` без SIP (новый номер / пустой `sipId`) | Никому                                               |
| inbound `status` (отвечен)                             | Сотрудник, чей `sipId` = `op`                        |
| outbound (мы звоним из NBOS)                           | Инициатор сразу                                      |

Пустой `sipId` у ответственного: webhook без `redirect_call`, лог `ats_redirect_skipped`. Звонок всё равно пишется.

`Employee.sipId` — HR / My Account → General → Contacts. Без SIP нет маршрута и нет исходящего click-to-call.

## 5. История

**Calls ≠ History-аудит.**

| Поверхность   | Где                                                                             |
| ------------- | ------------------------------------------------------------------------------- |
| Lead          | Вкладка **Calls** (рядом с History, не вместо)                                  |
| Deal          | Вкладка **Calls** (уже в sheet; не мешать с History)                            |
| Contact       | Лента в **Communication** (Messenger + calls + notes). Files остаётся Drive     |
| Delivery Card | Проекция той же ленты по Contact/Lead после даты карточки. Своего хранилища нет |

Строка ленты: направление, номер, кто, когда, статус, длительность, плеер, заметка. Files tab Contact **не** заменяет ленту (нет `uid` / disposition).

Нужен list API Call (`leadId` \| `contactId` \| `dealId`), не список Drive-файлов.

## 6. Запись

ATS даёт `record_link` и `GET call-record?uid`. Ссылка ATS может протухнуть.

Канон хранения:

1. Worker скачивает файл (`call-record`, fallback `record_link`).
2. Один `FileAsset`: `purpose=CALL_RECORDING`, `sourceModule=ats`, `fileType=AUDIO`, `confidentiality=CONFIDENTIAL`.
3. `FileLink` на `LEAD` и на `CONTACT` (если Contact есть).
4. `recordingFileAssetId` на Call.
5. Lead storage-home: `…/recordings/` (не `misc/lead/…`). Contact уже имеет `clients/contact-…/recordings/`.

Не хранить запись только как `EXTERNAL_URL`.

Транскрипта у ATS нет. «Что говорили» в этом срезе = заметка. Речь→текст — later.

## 7. Исходящий click-to-call

Кнопка «Позвонить» на Lead / Contact / Deal.

1. Браузер зовёт **внутренний** NBOS API (не `account.ats.am` из клиента).
2. API вызывает ATS `callback` (`from` = SIP текущего employee, `to` = номер).
3. Call создаётся сразу; окно — инициатору.
4. Нет `sipId` у звонящего → 4xx, не тихий fail.

## 8. Realtime

Окно должно открыться на **любом** экране NBOS, не только в Messenger.

Запрещено:

- событие на Messenger Socket.io (`/messenger`) — сокет не в app shell, нужен MESSENGER VIEW;
- пихать звонок в `notifications.unread.changed` — там только badge, без тела.

Канон транспорта: отдельный employee-канал в app shell (клон notification SSE + Redis pub/sub, BFF EventSource). События: `call.started`, `call.answered`, `call.finished` + snapshot контекста.

Новый Socket.IO namespace `/calls` в этом срезе не открывать.

## 9. Права

Как CRM:

- Seller — свои / назначенные Lead и Deal, свои звонки;
- Head of Sales / CEO / Owner — все;
- Marketing — без прослушивания записей;
- записи `CONFIDENTIAL`.

Settings → Integrations: карточка **ATS.am** (ключ настроен / нет), не «Applicant tracking coming soon». Секрет не показывать.

## 10. Устойчивость

Приём звонка — только `nbos-api` webhook. Scheduler **не** участвует в старте звонка.

Планируемая джоба `ats-call-history-reconcile` (каталог Scheduler, выкл по умолчанию): добрать `uid` из ATS `history`, не плодить Lead, докачать записи. Вкл в Settings → Scheduler после кода.

Ops (не код): Cloudflare skip Bot Fight на `POST /api/integrations/ats/webhook`; в кабинете ATS тот же `?key=`; ATS знают исходящий IP API/worker (их требование); у ответственных заполнен SIP.

`ATS_API_KEY`: webhook — только **api**; download/callback — **api + worker**. На scheduler ключ не нужен.

## 11. Later (не этот срез)

- Транскрипт / AI «что говорили»
- DID (`input`) → MarketingAccount
- Импорт истории Bitrix
- Popup всем селлерам
- Создание Contact на звонке

## 12. Связанное

- CRM overview: `01-CRM-Overview.md`
- Lead pipeline: `02-Lead-Pipeline.md`
- Clients Communication: `../03-Clients/03-Client-Portfolio.md`
- Drive `CALL_RECORDING`: `../11-Drive/01-File-Assets-and-Metadata.md`
- Scheduler catalog: `../16-Settings-Admin/05-Scheduler-Catalog.md`
