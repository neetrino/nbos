# ATS.am — контракт интеграции

> Провайдер телефонии: [ATS.am API](https://ats.am/ru/apidocumentacia) (также [hy](https://ats.am/hy/api_document)).
>
> **Продукт и UI** (кто видит окно, Lead/Contact, история, запись в Drive): [`../02-Modules/01-CRM/08-Calls-and-Telephony.md`](../02-Modules/01-CRM/08-Calls-and-Telephony.md), [`../05-UI-Specifications/11-Call-Screen.md`](../05-UI-Specifications/11-Call-Screen.md).
>
> Этот файл — только контракт ATS ↔ NBOS. Не дублировать продуктовую логику.

ATS отдаёт **четыре** возможности. Транскрипта нет.

| API                 | Направление | Зачем NBOS                             |
| ------------------- | ----------- | -------------------------------------- |
| Active Call webhook | ATS → NBOS  | Старт / ответ / конец, `redirect_call` |
| `callback`          | NBOS → ATS  | Click-to-call                          |
| `history`           | NBOS → ATS  | Сверка пропущенных `uid`               |
| `call-record`       | NBOS → ATS  | Скачать файл записи по `uid`           |

Перед исходящими вызовами ATS (`callback` / `history` / `call-record`) им нужно отдать **IP** API и worker. Это их требование, не настройка в коде.

---

## 1. Environment

| Variable      | Где                                                                     | Notes                                                                                |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ATS_API_KEY` | `nbos-api` обязательно для webhook; `nbos-worker` для download/callback | Optional at API boot. Unset → webhook `503`. Wrong/missing `key` → `401`.            |
| `ATS_API_KEY` | `nbos-scheduler`                                                        | Не нужен. Сверка history идёт через API/worker с ключом процесса, который зовёт ATS. |
| `ATS_API_KEY` | `nbos-web`                                                              | Не нужен. Браузер не зовёт ATS напрямую.                                             |

Ключ = код из кабинета ATS, раздел «Зарегистрированные данные». Не коммитить. Тот же ключ в URL webhook кабинета: `?key=`.

---

## 2. Active Call webhook (ATS → NBOS)

| Item    | Value                                                         |
| ------- | ------------------------------------------------------------- |
| Method  | `POST`                                                        |
| Path    | `/api/integrations/ats/webhook`                               |
| Auth    | Query `key` = env `ATS_API_KEY`                               |
| Body    | `application/x-www-form-urlencoded` или `multipart/form-data` |
| Success | HTTP `200` + **голый** JSON (не `{ data: … }`)                |

Production: `https://nbos.neetrino.com/api/integrations/ats/webhook?key=…`

Маршрут публичный (`@Public`). Throttle на этот path не применять. Ответ **не** оборачивать глобальным transform interceptor.

Ops: Cloudflare не должен резать server-to-server POST (Bot Fight / 1010). Skip на этот path.

### 2.1 Response

`redirect_call` — поле **нашего** JSON. Отдельный запрос на `account.ats.am` не делаем. ATS ждёт этот JSON для маршрута.

| Case                                                     | Body                                                |
| -------------------------------------------------------- | --------------------------------------------------- |
| Нет маршрута / finish·end / outbound                     | `{ "status": "success" }`                           |
| Inbound `state=start` + известный Contact или Lead с SIP | `{ "status": "success", "redirect_call": "<sip>" }` |

SIP из `Employee.sipId`, не хардкод. Пример: `"3126107"`.

### 2.2 Payload

`state`, `uid`, `input`, `clid`, `op`, `rate`, `billsec`, `calldirect`, `disposition`, `channel`, `record_link`

| Field         | Semantics                                                  |
| ------------- | ---------------------------------------------------------- |
| `state`       | `start` \| `status` (answered) \| `finish` \| `end`        |
| `calldirect`  | `"0"` inbound, `"1"` outbound                              |
| `disposition` | `ANSWERED` \| `NO ANSWER`                                  |
| `uid`         | Уникальный id звонка (идемпотентность)                     |
| `clid`        | Номер собеседника                                          |
| `op`          | Номер/SIP, на который сел звонок                           |
| `input`       | DID (маркетинг later)                                      |
| `rate`        | 0–5, обычно на конце                                       |
| `billsec`     | Длительность                                               |
| `record_link` | URL записи; может протухнуть — канон хранения в `08-Calls` |

Неизвестные поля игнорировать.

### 2.3 Поведение ingest (контракт)

Продуктовые правила attach — `08-Calls` + `07-Lead-and-Deal-Merge`. Здесь только граница провайдера:

| Case                                                         | NBOS                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| Неверный / пустой `key`                                      | `401`, ничего не писать                                 |
| Ключ не задан                                                | `503`                                                   |
| Нет `uid`                                                    | `400`                                                   |
| Тот же `uid`                                                 | Update той же строки Call                               |
| Inbound `start` (или первое не-терминальное появление `uid`) | Нормализация `clid` → attach или Lead                   |
| Outbound                                                     | Строка Call; Lead если номер новый (продукт `08-Calls`) |
| `finish` / `end`                                             | Update; **без** `redirect_call`                         |
| Inbound `start` + SIP                                        | `redirect_call` в голом JSON                            |

### 2.4 Резолв `redirect_call` (inbound `start` only)

1. Нормализовать `clid` (тот же phone helper, AM defaults).
2. Contact first (primary + extra phones, не Trash) → иначе Lead по телефону.
3. SIP:
   - Lead: `assignedTo` → `Employee.sipId`;
   - Contact: последний не-Trash Deal (`contactId` или additional) → `sellerId` → `sipId`; fallback — последний не-Trash Lead этого Contact с `assignedTo`.
4. Нет assignee / пустой SIP → без `redirect_call`, лог `ats_redirect_skipped`.
5. Новый номер → `{ "status": "success" }` без redirect; Lead по правилам продукта.

### 2.5 Lead при создании с ATS

| Field                  | Value                                        |
| ---------------------- | -------------------------------------------- |
| `source`               | `MARKETING`                                  |
| `sourceDetail`         | `ATS`                                        |
| `phone`                | `+{digits}`                                  |
| `contactName` / `name` | `Incoming call {phone}`                      |
| `code`                 | Тот же генератор `L-{year}-{nnnn}`, что Meta |

Contact на webhook не создаём.

---

## 3. Callback (NBOS → ATS)

Click-to-call. Браузер **не** вызывает ATS.

`GET https://account.ats.am/docs/api/v1/callback?key=…&from=…&to=…`

| Query  | Смысл                                   |
| ------ | --------------------------------------- |
| `key`  | Тот же `ATS_API_KEY`                    |
| `from` | SIP / номер вызывающего (наш сотрудник) |
| `to`   | Номер клиента                           |

Внутренний NBOS `POST` (авторизованный employee) → сервер собирает `from`/`to` → ATS. Пустой SIP инициатора → 4xx.

---

## 4. History (NBOS → ATS)

`GET https://account.ats.am/docs/api/v1/history?key=…&dateStart=Y-M-D&dateEnd=Y-M-D&rows=…&start=…`

Для сверки `uid`, не для UI-ленты вживую. Джоба планировщика — продукт `08-Calls` §10. Те же правила attach, без второго Lead.

Поля ответа ATS (пример): `uniqueid`, `linkedid`, `start`, `endz`, `duration`, `disposition`, `status`, `destination`, `extension`, `in_num` / `ext_num`.

---

## 5. Call record (NBOS → ATS)

`GET https://account.ats.am/docs/api/v1/call-record?key=…&uid=…`

`uid` = File ID / id звонка. Worker качает байты → Drive. Fallback: webhook `record_link`, если `call-record` недоступен. Канон файла: `08-Calls` §6.

---

## 6. Employee SIP

| Field            | Storage            | Editable                                                   |
| ---------------- | ------------------ | ---------------------------------------------------------- |
| `Employee.sipId` | `employees.sip_id` | HR employee sheet; `PUT /me/profile`; `PUT /employees/:id` |

---

## 7. Runtime сегодня vs канон

| Есть в коде                                                              | Ещё нет                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| Webhook, ключ, inbound/outbound CRM Call, дедуп `uid`, логика redirect   | Голый JSON ответа (сейчас может быть обёртка `{ data }`) |
| `AtsCallEvent` = Call: `leadId`, `contactId`, `dealId`, employee context | `projectId` / `productId`, note, recording FileAsset     |
| `GET /crm/calls`, `GET /crm/calls/:id`                                   | Callback, history reconcile, download job                |
| Incoming-call SSE (`GET /realtime/calls`) + app-shell popup              | `call.answered` / `call.finished` windows                |
| CALL activities on Lead/Deal History and Contact Communication           | Recording player, click-to-call                          |

---

## 8. Related

- Product: `../02-Modules/01-CRM/08-Calls-and-Telephony.md`
- External services: `04-External-Services.md`
- Meta ingest: `08-Meta-Messaging-Identity-and-Lead-Dedup.md`
- Lead pipeline: `../02-Modules/01-CRM/02-Lead-Pipeline.md`
