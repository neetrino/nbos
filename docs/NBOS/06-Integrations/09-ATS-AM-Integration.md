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

| Variable                      | Где                                                                     | Notes                                                                                |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ATS_API_KEY`                 | `nbos-api` обязательно для webhook; `nbos-worker` для download/callback | Optional at API boot. Unset → webhook `503`. Wrong/missing `key` → `401`.            |
| `ATS_API_KEY`                 | `nbos-scheduler`                                                        | Не нужен. Сверка history идёт через API/worker с ключом процесса, который зовёт ATS. |
| `ATS_API_KEY`                 | `nbos-web`                                                              | Не нужен. Браузер не зовёт ATS напрямую.                                             |
| `ATS_RECORDING_ALLOWED_HOSTS` | `nbos-api` + `nbos-worker`                                              | Optional. Extra **exact** HTTPS hostnames for `record_link` / redirects.             |

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

`redirect_call` — поле **нашего** JSON. Отдельный запрос на `account.ats.am` не делаем. ATS ждёт этот JSON для маршрута. Поле `status` **не** отправлять — ATS его не использует.

| Case                                                     | Body                           |
| -------------------------------------------------------- | ------------------------------ |
| Нет маршрута / finish·end / outbound                     | `{}`                           |
| Inbound `state=start` + известный Contact или Lead с SIP | `{ "redirect_call": "<sip>" }` |

SIP из `Employee.sipId`, не хардкод. Пример: `{"redirect_call":"15"}`.

### 2.2 Payload

`state`, `uid`, `lid`, `input`, `clid`, `op`, `rate`, `billsec`, `calldirect`, `disposition`, `channel`, `record_link`

| Field         | Semantics                                                            |
| ------------- | -------------------------------------------------------------------- |
| `state`       | `start` \| `status` (answered) \| `finish` \| `end`                  |
| `calldirect`  | `"0"` inbound, `"1"` outbound                                        |
| `disposition` | `ANSWERED` \| `NO ANSWER`                                            |
| `uid`         | Sub-leg id; NBOS Call identity (идемпотентность)                     |
| `lid`         | Global call id; parsed for logs only, not Call identity (follow-up)  |
| `clid`        | Inbound: номер клиента. Outbound: часто локальный SIP, **не** клиент |
| `op`          | SIP сотрудника (`3103585` или `3103585-26`)                          |
| `input`       | Inbound: DID. Outbound: набранный номер клиента                      |
| `rate`        | 0–5, обычно на конце                                                 |
| `billsec`     | Длительность                                                         |
| `record_link` | URL записи; может протухнуть — канон хранения в `08-Calls`           |

Неизвестные поля игнорировать. `lid` не пишется в DB в этом срезе.

### 2.3 Поведение ingest (контракт)

Продуктовые правила attach — `08-Calls` + `07-Lead-and-Deal-Merge`. Здесь только граница провайдера:

| Case                                                         | NBOS                                                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Неверный / пустой `key`                                      | `401`, ничего не писать                                                                         |
| Ключ не задан                                                | `503`                                                                                           |
| Нет `uid`                                                    | `400`                                                                                           |
| Тот же `uid`                                                 | Atomic persist той же строки Call; absent fields не затирают; terminal `finish`/`end` absorbing |
| Concurrent webhook на один `uid`                             | Unique `uid` + P2002 recovery; ATS 200, не 500                                                  |
| Inbound `start` (или первое не-терминальное появление `uid`) | Нормализация `clid` → attach или Lead                                                           |
| Outbound (`calldirect=1`)                                    | Клиентский номер из `input` (fallback `clid`); тот же CRM resolver; `op` → Employee.sipId       |
| `finish` / `end`                                             | Update; **без** `redirect_call`                                                                 |
| Inbound `start` + SIP                                        | `redirect_call` в голом JSON                                                                    |

### 2.4 Резолв `redirect_call` (inbound `start` only)

1. Нормализовать `clid` (тот же phone helper, AM defaults).
2. Contact first (primary + extra phones, не Trash) → иначе Lead по телефону.
3. SIP:
   - Lead: `assignedTo` → `Employee.sipId`;
   - Contact: последний не-Trash Deal (`contactId` или additional) → `sellerId` → `sipId`; fallback — последний не-Trash Lead этого Contact с `assignedTo`.
4. Нет assignee / пустой SIP → без `redirect_call`, лог `ats_redirect_skipped`.
5. Новый номер → `{}` без `redirect_call`; Lead по правилам продукта.

### 2.5 Lead при создании с ATS

| Field                  | Value                                               |
| ---------------------- | --------------------------------------------------- |
| `source`               | `MARKETING`                                         |
| `sourceDetail`         | `ATS`                                               |
| `phone`                | `+{digits}`                                         |
| `contactName` / `name` | `Incoming call {phone}` или `Outgoing call {phone}` |
| `code`                 | Тот же генератор `L-{year}-{nnnn}`, что Meta        |

Contact на webhook не создаём.

### 2.6 Monotonic state

Canonical order from §2.2 (not inferred from live traffic):

| From \ To          | start     | status    | finish    | end                   |
| ------------------ | --------- | --------- | --------- | --------------------- |
| (new/null/unknown) | yes       | yes       | yes       | yes                   |
| start              | duplicate | yes       | yes       | yes                   |
| status             | no        | duplicate | yes       | yes                   |
| finish             | no        | no        | duplicate | no (already terminal) |
| end                | no        | no        | no        | duplicate             |

`initiated` is NBOS-local (click-to-call) and may advance to any provider state. Terminal `finish`/`end` are absorbing. Duplicate same state is idempotent. Unknown incoming states do not lower a known state. Conditional `updateMany` uses predecessor states in WHERE. SSE and recording enqueue run only when the corresponding transition is applied (or first-seen terminal recording).

Sparse patch: absent form key = do not change. Explicit empty is preserved at parse (`null`) and is not written unless a future ATS contract documents a clear. Do not use `payload.field ?? null`.

---

## 3. Callback (NBOS → ATS)

Click-to-call. Браузер **не** вызывает ATS.

`GET https://account.ats.am/docs/api/v1/callback?key=…&from=…&to=…`

| Query  | Смысл                                   |
| ------ | --------------------------------------- |
| `key`  | Тот же `ATS_API_KEY`                    |
| `from` | SIP / номер вызывающего (наш сотрудник) |
| `to`   | Номер клиента                           |

Внутренний NBOS `POST /crm/calls/click-to-call` (авторизованный employee, обязательный header `Idempotency-Key`) → сервер собирает `from`/`to` → ATS. Пустой SIP инициатора → 4xx.

Documented callback query is only `key`, `from`, `to`. There is no provider idempotency token, request id, or callback status lookup in this contract. NBOS therefore uses **at-most-once** per actor-scoped key: durable `AtsCallIntent` is created **before** ATS; only one request claims `PROCESSING` and may call ATS; `PROCESSING` after an unknown transport outcome is not auto-retried (possible missed NBOS Call, never a double callback for that key). `ACCEPTED` / `FAILED` replays return the stored result.

Callback JSON is not documented to return `uid`. Intent links to the Call row NBOS persists after ATS accept (`callId`). Webhook later may replace synthetic `ctc:` uid on that same Call. Matching a webhook to a pending click-to-call is by phone + 10-minute window + optional initiator SIP (`op`). ATS callback often arrives as inbound (`calldirect=0`); NBOS still attaches it to the outbound click-to-call row. While the Active Call Screen is open, `GET /crm/calls/:id/screen` may peek ATS `history` for a pending click-to-call that never received `finish`/`end`.

---

## 4. History (NBOS → ATS)

`GET https://account.ats.am/docs/api/v1/history?key=…&dateStart=Y-M-D&dateEnd=Y-M-D&rows=…&start=…`

Для сверки `uid` и для live peek открытого click-to-call (не лента UI). Джоба планировщика `ats-call-history-reconcile` — продукт `08-Calls` §10, ещё не shipped. Те же правила attach, без второго Lead. Live peek не заменяет webhook: он только закрывает pending `CLICK_TO_CALL`, пока сотрудник смотрит окно.

Ответ Solr-style: `{ numFound, start, docs: [...] }`. Поля строки: `uniqueid`, `linkedid`, `start`, `endz`, `duration`, `disposition`, `status` (`Out Call` / `Incoming Call` / `Local Call`), `destination`, `extension`, `in_num` / `ext_num`. Timestamps — Asia/Yerevan, даже с суффиксом `Z`; live peek сдвигает «будущий» start на UTC+4, если ATS записал ереванские часы как UTC. Номера часто с ведущим минусом (`-043729201`). Live peek берёт до 200 строк и последнюю страницу дня, если `numFound` больше. Click-to-call матчится с `Out Call` по телефону и окну старта.

---

## 5. Call record (NBOS → ATS)

`GET https://account.ats.am/docs/api/v1/call-record?key=…&uid=…`

`uid` = File ID / id звонка. Worker качает байты → Drive. Fallback: webhook `record_link`, если `call-record` недоступен. Канон файла: `08-Calls` §6.

### 5.1 Recording URL policy (SSRF)

`call-record` and every `record_link` / `Location` hop use the same fail-closed policy before any body is read or written to R2:

- HTTPS only, no URL credentials, port empty or `443`.
- Hostname must match an **exact** allowlist after lowercasing and stripping trailing dots. No suffix match (`evilats.am` is not `account.ats.am`).
- IP literals are denied. DNS resolves all A/AAAA addresses; the hop is denied if DNS fails, returns empty, or any address is not public global-unicast (including loopback, private, link-local, CGNAT, multicast, reserved/documentation, IPv4-mapped IPv6, cloud metadata).
- Connection uses the already-validated addresses (pinned lookup). TLS SNI / certificate checks stay on the allowlisted hostname.
- Redirects are followed manually, up to `ATS_CALL_RECORDING_MAX_REDIRECTS` (3). Each `Location` (including relative) is re-validated. Missing Location, loops, and over-limit are denied. Authorization headers are not set and are not forwarded.

**Allowlist contract**

- Built-in (canon): `account.ats.am`.
- Extra hosts: `ATS_RECORDING_ALLOWED_HOSTS` — comma-separated exact hostnames only (no wildcards, no IPs, no URLs). Invalid entries are ignored (narrower allowlist).
- If production `record_link` or an ATS redirect uses another hostname, that exact name must be added to `ATS_RECORDING_ALLOWED_HOSTS`. Do not guess CDN names. Until it is set, download of that URL fails closed (`FAILED` / retry per existing recording errors).
- Do not log the full recording URL or query (it may contain a token / `ATS_API_KEY`).

---

## 6. Employee SIP

| Field            | Storage            | Editable                                                   |
| ---------------- | ------------------ | ---------------------------------------------------------- |
| `Employee.sipId` | `employees.sip_id` | HR employee sheet; `PUT /me/profile`; `PUT /employees/:id` |

---

## 7. Runtime сегодня vs канон

| Есть в коде                                                                                                                                                                     | Ещё нет                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Webhook, ключ, inbound/outbound CRM Call, `redirect_call`, голый JSON (`@SkipTransform`)                                                                                        | Scheduler `ats-call-history-reconcile`                                    |
| Atomic `uid` persist, P2002 recovery, sparse patch, monotonic start→status→finish/end                                                                                           | `projectId` / `productId` persisted on Call (screen reads them from Deal) |
| `AtsCallEvent` = Call: `leadId`, `contactId`, `dealId`, employee context, `note`, `recordingFileAssetId`                                                                        | Provider callback idempotency (ATS documents only `key`/`from`/`to`)      |
| `GET /crm/calls`, `GET /crm/calls/:id`, `GET /crm/calls/:id/recording`, `GET /crm/calls/:id/screen` (pending click-to-call may peek ATS `history`), `PATCH /crm/calls/:id/note` |                                                                           |
| Active-call SSE (`GET /realtime/calls`): `call.started` / `call.answered` / `call.finished` + fullscreen screen                                                                 |                                                                           |
| CALL activities on Lead / Deal / Contact **Calls** tabs                                                                                                                         |                                                                           |
| Worker `ats-call-recording-download` → Drive FileAsset                                                                                                                          |                                                                           |
| `POST /crm/calls/click-to-call` + `Idempotency-Key` → `AtsCallIntent` at-most-once ATS `callback`                                                                               |                                                                           |

---

## 8. Related

- Product: `../02-Modules/01-CRM/08-Calls-and-Telephony.md`
- External services: `04-External-Services.md`
- Meta ingest: `08-Meta-Messaging-Identity-and-Lead-Dedup.md`
- Lead pipeline: `../02-Modules/01-CRM/02-Lead-Pipeline.md`
