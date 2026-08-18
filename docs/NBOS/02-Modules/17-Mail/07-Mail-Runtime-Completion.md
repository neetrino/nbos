# Mail — ТЗ на закрытие runtime (production)

**Модуль.** `17-Mail`  
**Статус.** Спецификация к реализации. Срез A — в работе (`feat/mail-runtime-a`). Срезы B и C не начинать в этом PR.  
**Дата.** 2026-08-19  
**Владелец документа.** Engineering (Mail runtime)

Этот документ — полное техническое задание: что должно получиться, как это устроено, в каком порядке делается и когда модуль считается закрытым. Продуктовый канон (`00`–`06`) остаётся источником поведения. Здесь — **как довести уже выбранную модель до рабочего production-контура**.

Стек не меняем: NestJS + Prisma/PostgreSQL + BullMQ/Redis + provider adapters (Gmail API, IMAP/SMTP) + Drive `FileAsset`. Microsoft Graph, свой mail-сервер и отдельный mail-only микросервис **не входят**.

---

## 1. Зачем

Сотрудник должен надёжно получать и отправлять почту из CRM.

После этой работы:

- входящие не теряются, даже если Gmail Watch, Pub/Sub или IMAP IDLE временно молчат;
- отправка не держит HTTP-запрос на Gmail/SMTP;
- одно письмо нельзя отправить дважды;
- новый ящик начинает жить без рестарта процессов;
- несколько ящиков и несколько replica API/worker работают предсказуемо;
- после падения Redis, провайдера, worker или API система сама продолжает работу;
- в UI и логах видно, почему конкретное письмо не пришло или не ушло;
- в production нет stub/inline обходов.

---

## 2. Что сознательно не делаем

| Вне скоупа                               | Почему                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Полноценный Gmail/Outlook-клиент         | Канон: inbox + compose/reply + threads, не labels/filters/snooze                          |
| Microsoft Graph / новые провайдеры       | Только `GMAIL` и `CORPORATE_IMAP_SMTP`                                                    |
| Отдельный процесс только для почты       | Достаточно `api` + `worker` + `scheduler`                                                 |
| KMS, field-encryption тела письма        | Уже зафиксировано в `06-Mail-Security-Stance.md`                                          |
| Автосоздание Lead/Deal из письма         | Mail не меняет чужой lifecycle                                                            |
| Transactional email (инвайты, дайджесты) | Это Notifications, не inbox                                                               |
| Prometheus/Grafana-платформа             | Structured logs + существующие Mail logs/health; общий мониторинг BullMQ — отдельный todo |

---

## 3. Целевая архитектура

```text
ПОЛУЧЕНИЕ
  Gmail:  mailbox → users.watch → Pub/Sub → POST /mail/pubsub/google
  IMAP:   mailbox → IDLE (один holder на ящик) → exists
  Safety: scheduler poll (раз в 5 мин) по активным ящикам
                 ↓
            enqueue mail.sync   jobId = mail-sync:{mailAccountId}
                 ↓
            Mail Worker
                 ↓
            adapter.fetchDelta → upsert PostgreSQL → CRM inbox

ОТПРАВКА
  UI → POST compose/reply
     → persist DRAFT → QUEUED (одна транзакция)
     → enqueue mail.send   jobId = mail-send:{messageId}
     → HTTP **200** + thread (`deliveryStatus=QUEUED`) когда job принят очередью
                 ↓
            Mail Worker
                 ↓
            QUEUED → SENDING (условный UPDATE)
                 ↓
            adapter.sendMessage (Gmail API / SMTP)
                 ↓
            SENT  или  FAILED
            при revoke/auth: письмо FAILED, ящик NEEDS_RECONNECT
```

**Правила контура**

1. PostgreSQL — source of truth для UI. Inbox не ходит в провайдера на каждый клик.
2. В production API **не** вызывает Gmail/SMTP/IMAP sync inline.
3. Если Redis недоступен в production — команда не выполняется «тихо в том же запросе» и **не** шлётся inline. Compose/reply: persist `QUEUED` → enqueue fail → HTTP **503**, строка остаётся `QUEUED` (reconcile поставит job). Persist fail → HTTP **503**, строки нет. Ручной sync отвечает 503.
4. Local без Redis допускается только при `NODE_ENV !== production` и явном логе `mail.inline_fallback`. В production этого кода-пути нет.
5. Один канонический receive-flow, один send-flow.

---

## 4. Процессы и ответственность

| Процесс          | `PROCESS_ROLE` | Mail делает                                                                            |
| ---------------- | -------------- | -------------------------------------------------------------------------------------- |
| `nbos-api`       | `api`          | REST, Gmail OAuth, Pub/Sub webhook, enqueue, **не** держит IMAP IDLE, **не** шлёт SMTP |
| `nbos-worker`    | `worker`       | `mail.sync`, `mail.send`, `mail.attachment.download`; **держит IDLE** под Redis lock   |
| `nbos-scheduler` | `scheduler`    | Watch renewal, fallback poll, orphan-QUEUED reconcile, stale-IDLE reclaim              |

`PROCESS_ROLE=all` — только local/dev. В production `all` запрещён, как сейчас.

---

## 5. Состояния

### 5.1 Ящик — `MailAccount.status`

| Статус            | Смысл                       | Sync       | Send              | IDLE / Watch |
| ----------------- | --------------------------- | ---------- | ----------------- | ------------ |
| `ACTIVE`          | Норма                       | да         | да                | да           |
| `SYNCING`         | Идёт sync (короткое)        | уже идёт   | да                | да           |
| `DEGRADED`        | Повторяемые сбои провайдера | poll/retry | да, пока SMTP жив | reconnect    |
| `NEEDS_RECONNECT` | Auth/revoke/неверный пароль | нет        | нет               | нет          |
| `PAUSED`          | Остановлено вручную         | нет        | нет               | нет          |
| `DISABLED`        | Отключено                   | нет        | нет               | нет          |

`MailProviderConnection.status` зеркалит техническое состояние: `CONNECTED` / `DEGRADED` / `NEEDS_RECONNECT` / `NOT_CONNECTED` / `PAUSED`.

`NEEDS_RECONNECT` живёт **на ящике**, не на письме.

### 5.2 Исходящее письмо — `EmailDeliveryStatus`

```text
DRAFT → QUEUED → SENDING → SENT
              ↘          ↘ FAILED
QUEUED → CANCELLED
SENDING не отменяем (провайдер уже мог принять письмо)
FAILED → QUEUED   (ручной retry)
FAILED → DRAFT    (правка и повторная постановка)
SENT терминален
```

В схему **добавляется** `SENDING`.  
`NEEDS_RECONNECT` в enum письма **не добавляется**.

### 5.3 Вложение — `EmailAttachmentDownloadStatus`

`PENDING` → `READY` | `FAILED`  
Повтор download: `FAILED` → `PENDING` + тот же job.

---

## 6. Очередь

Очередь одна: `mail`. Три job.

| Job                        | Payload                                                       | `jobId`                     | Смысл                      |
| -------------------------- | ------------------------------------------------------------- | --------------------------- | -------------------------- |
| `mail.sync`                | `{ kind: 'sync', mailAccountId }`                             | `mail-sync:{mailAccountId}` | Один sync на ящик в полёте |
| `mail.send`                | `{ kind: 'send', mailAccountId, messageId, actorEmployeeId }` | `mail-send:{messageId}`     | Одна отправка на письмо    |
| `mail.attachment.download` | `{ kind: 'attachment', messageId, attachmentId }`             | `mail-att:{attachmentId}`   | Один download на вложение  |

Повторный `queue.add` с тем же `jobId`, пока job жив — no-op (уже есть / in-flight). Это основной debounce для Pub/Sub + IDLE + poll.

Опции (как critical-очередь уже настроена):

- `attempts: 5`
- `backoff: exponential, delay 5000`
- concurrency: `BULLMQ_MAIL_CONCURRENCY` (default 5)

**Ретраи должны срабатывать.** Worker **пробрасывает** transient-ошибки. Permanent — фиксирует терминальный статус и **завершает job успешно** (не жечь 5 попыток на revoke).

Классификация — общая функция `classifyMailProviderError(error)`:

| Класс             | Примеры                                                                            | Действие                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Transient         | timeout, `ECONNRESET`, `ETIMEDOUT`, HTTP 429/5xx, IMAP drop, Redis blip внутри job | throw → BullMQ retry                                                                                     |
| Auth permanent    | `invalid_grant`, 401, IMAP AUTH fail                                               | ящик `NEEDS_RECONNECT`, sync/send стоп, job complete                                                     |
| Message permanent | 5.1.1 recipient, invalid mailbox, reject без retry-hint                            | письмо `FAILED`, ящик не трогаем, job complete                                                           |
| Ambiguous send    | SMTP/Gmail приняли запрос, ответ не дошёл (timeout после submit)                   | письмо `FAILED`, delivery log `OUTCOME_UNKNOWN`, **не** слепой retry; только ручной retry после проверки |

---

## 7. Получение почты

Любой вход (Pub/Sub, IDLE, poll, connect, кнопка Sync) делает одно: `enqueueSync(mailAccountId)`.  
Worker: `fetchDelta(cursor)` → normalize → upsert → сохранить новый cursor **только после успешного upsert**.

### 7.1 Идемпотентность inbound

- Unique: `@@unique([mailAccountId, providerMessageId])` на `EmailMessage`.
- Повтор — skip, не ошибка (unique-violation / find).
- Sync двух ящиков независим.

### 7.2 Gmail

После OAuth connect и при каждом успешном reconnect:

1. `users.watch` на INBOX, topic из `MAIL_GMAIL_PUBSUB_TOPIC`.
2. Сохранить `gmailWatchExpiresAt` (поле уже есть).
3. `MailSyncLogKind.WATCH_RENEWED`.
4. Поставить `mail.sync` (initial / recovery).

**Renewal (scheduler, не API-таймер):**

- Job: `mail-gmail-watch-renew`.
- Cron: каждый час (`0 * * * *`, TZ `Asia/Yerevan`).
- Выбирать ящики, у которых `gmailWatchExpiresAt` пустой или истекает в ближайшие **24 часа**.
- Повторный `users.watch`, обновить expiry.

**Pub/Sub:** существующий `POST /mail/pubsub/google` + `MAIL_GMAIL_PUBSUB_TOKEN`. OIDC-верификацию Google в этот срез не тащим.

**historyId:**

- Incremental: `users.history.list` от сохранённого id.
- `404` / `410` (history протух) → recovery: последние `MAIL_INITIAL_SYNC_WINDOW` писем INBOX (сейчас 30), записать свежий `historyId` с профиля **после** upsert.
- Cursor не двигать, если upsert упал.

**Auth/revoke** на любом Gmail вызове → `NEEDS_RECONNECT` + `RECONNECT_REQUIRED` в sync log. Watch/sync для этого ящика не ставить, пока пользователь не переподключит OAuth.

Если topic не задан — Gmail работает через poll + ручной sync; в health явно: `watch: not_configured`. Не притворяться, что push есть.

### 7.3 Corporate IMAP — IDLE

Long-lived соединение живёт **только в worker**, не в API.

На ящик — **один** IDLE:

- Redis lock: `mail:idle:{mailAccountId}`.
- TTL **90 с**, heartbeat каждые **30 с**.
- Holder пишет `idleHolderId`, `idleHeartbeatAt` (новые поля connection или ключи только в Redis; в БД — `imapIdleHeartbeatAt` для health UI).
- Реплика без lock **не** открывает IMAP.
- Нет heartbeat **90 с** → lock считается мёртвым, другой worker может забрать.

После `connectCorporate` API:

1. Сохраняет ящик и секрет.
2. Ставит `mail.sync`.
3. IDLE стартует **только как side-effect connect-sync** в worker: после успешного initial/recovery sync worker вызывает `ensureIdle(accountId)`. Отдельный job `mail.idle.ensure` **не** вводим. Это **срез B**, не A.
4. Рестарт API **не требуется**.

Внутри IDLE:

- `exists` → `enqueueSync` (тот же jobId).
- Обрыв: backoff **5 с → 15 с → 30 с → cap 120 с** + jitter ±20 %.
- Watchdog: соединение «usable», но нет `exists` и нет успешного sync дольше **2 × poll interval** (10 мин) → принудительный reconnect + sync.
- Смена `UIDVALIDITY` → сброс `imapLastUid`, recovery-окно, не дочитывать старый UID.
- Disconnect ящика / `DISABLED` / `PAUSED` / `NEEDS_RECONNECT` → logout, снять lock, больше не коннектиться.

`startWatchOrIdle` у IMAP-адаптера остаётся no-op. Владелец сокета — `MailImapIdleService` на worker (`shouldRegisterBullmqWorkers`), не `shouldStartApiSideEffects`.

### 7.4 Fallback / reconciliation poll

Safety-net, не основной канал.

- Scheduler job: `mail-sync-reconcile`.
- Cron: `*/5 * * * *` (каждые 5 минут, Yerevan).
- Флаг: `SCHEDULER_MAIL_SYNC_RECONCILE_ENABLED`.
- В реестр `docs/architecture/scheduler-cron-roster.md` отдельной строкой. **Не включать пакетом** с чужими cron; после выкладки — отдельное решение вкл на проде.
- Выборка: `ACTIVE` и `DEGRADED`, не `PAUSED` / `DISABLED` / `NEEDS_RECONNECT`.
- На каждый ящик — только `enqueueSync` с тем же `jobId`.
- Полный scan ящика запрещён.

**Orphan outbound (срез A, не inbox poll):** отдельный job `mail-outbound-reconcile`.

- Cron: `*/2 * * * *` (каждые 2 минуты, Yerevan).
- Флаг: `SCHEDULER_MAIL_OUTBOUND_RECONCILE_ENABLED` — default **off**.
- В roster отдельной 🟡 строкой. Не включать пакетом.
- `QUEUED` старше **60 с** → снова `enqueueSend` (`jobId` тот же).
- `SENDING` старше **10 мин** без `providerMessageId` → обратно в `QUEUED` + `enqueueSend`.
- `SENDING` с `providerMessageId` → довести до `SENT`, **не** слать снова.

Inbox poll (`mail-sync-reconcile`, каждые 5 мин) — **только срез B**. В A не добавлять.

---

## 8. Отправка

### 8.1 HTTP (compose / reply)

Один запрос:

1. RBAC send + rate limit (как сейчас).
2. Транзакция: thread (если новый) + message `DRAFT` + recipients + outbound attachments (уже существующие `FileAsset`) + перевод в `QUEUED` + delivery log `OUTBOUND_QUEUED`.
3. После commit — `enqueueSend`. **Не** откатывать в `DRAFT`. **Не** вызывать провайдера из HTTP.

**Зафиксированный порядок commit / enqueue (без развилок):**

```text
DB commit QUEUED
  → enqueue mail.send  jobId = mail-send:{messageId}
  → enqueue принят: HTTP 200 + thread, deliveryStatus=QUEUED
  → enqueue fail в production: оставить QUEUED, HTTP 503
    (не inline-send, не rollback в DRAFT; reconcile поставит job)
  → persist fail: HTTP 503, строки нет
```

`503` = не вошли в send-контур (в production нет Redis / job не встал).  
`200` = job принят очередью. Не использовать `202`.

Local (`NODE_ENV !== production`) без Redis: inline fallback **разрешён** с логом `mail.inline_fallback`. Production **никогда** не шлёт inline.

Не ждать SMTP. UI после ответа **инвалидирует thread query** и показывает QUEUED → затем SENT/FAILED (poll query / уже существующие notifications).

`POST …/finalize-send-stub` **удаляется**.  
`POST …/queue` **остаётся** как реальный `DRAFT → QUEUED` + `enqueueSend` (web шлёт сохранённые черновики). Это не stub и не prod-обход HTTP-send.

### 8.2 Worker send

1. Загрузить сообщение. Если нет / не outbound — exit.
2. Если уже `SENT` или `CANCELLED` — exit, провайдера не звать.
3. Условный переход:

```sql
UPDATE email_messages
SET delivery_status = 'SENDING'
WHERE id = :id AND delivery_status = 'QUEUED'
```

0 строк → exit (другой worker уже взял, или статус сменился).

4. Собрать MIME: тело + FileAsset вложения (скачать из Drive/R2 в worker, не из HTTP).
5. `adapter.sendMessage`.
6. Успех: `SENT`, `sentAt`, `providerMessageId` / `messageIdHeader`, thread `lastOutboundAt`, log `OUTBOUND_SENT`, audit.
7. Transient (провайдер точно не принял): оставить `SENDING` (reconcile вернёт в `QUEUED` если worker умер) и **throw** — BullMQ retry. Не inline-complete.
8. Permanent message: `FAILED` + log.
9. Auth: `FAILED` + ящик `NEEDS_RECONNECT`.
10. Ambiguous: `FAILED` + `OUTCOME_UNKNOWN`, не retry автоматически.

`SENDING`, зависший дольше **10 минут** (worker умер после UPDATE, до провайдера): reconcile переводит обратно в `QUEUED` и ставит job заново — **только если** нет признаков accept (нет `providerMessageId`). Если `providerMessageId` уже есть — довести до `SENT`, не слать снова.

### 8.3 Ручной retry

- `FAILED → QUEUED` + `enqueueSend` через `POST …/retry-send` (тело не меняют).
- Существующий `reset-failed-to-draft` оставляем для правки тела; затем снова `queue` или compose/reply.
- Из `SENT` retry невозможен.

---

## 9. Вложения

Канон: бинари только в Drive. Письмо в inbox существует даже если файл ещё качается.

### 9.1 Schema

`EmailAttachment.fileAssetId` становится **опциональным**, пока статус `PENDING` или `FAILED` без файла.

### 9.2 Inbound

1. Sync сохраняет письмо + строки вложений: имя, mime, size, `providerAttachmentId`, `PENDING`, `fileAssetId = null`.
2. На каждое вложение — `mail.attachment.download`.
3. Worker: `adapter.downloadAttachment` → Drive `FileAsset` → `READY`.
4. Ошибка transient — throw. Permanent / oversized — `FAILED`, письмо остаётся.
5. UI: тело письма доступно; вложение — pending / ready / failed + retry.

**Лимит размера (значение этого ТЗ):** 25 MiB на файл. Больше — не качаем, `FAILED`, причина в log. Меньше канонного «утвердить лимиты» не открываем: 25 MiB фиксируем здесь; менять — отдельным решением.

Initial import по-прежнему **последние 30 писем** (`MAIL_INITIAL_SYNC_WINDOW`). Историю глубже не тянем в этом ТЗ.

### 9.3 Outbound

Compose уже принимает `fileAssetIds`. Worker обязан реально приложить их к Gmail raw MIME / Nodemailer `attachments`. Сейчас send-контекст вложения не читает — это дыра, её закрываем в send-срезе, не оставляем на «потом».

Inline CID (`isInline`) для исходящих: если в HTML есть cid — маппить. Если нет — обычные attachments. Не строить полный HTML-дизайнер.

---

## 10. Несколько ящиков и несколько replica

| Риск                     | Защита                                      |
| ------------------------ | ------------------------------------------- |
| Два sync одного ящика    | `jobId = mail-sync:{id}`                    |
| Два send одного письма   | `jobId` + `QUEUED→SENDING`                  |
| Два inbound insert       | unique `(mailAccountId, providerMessageId)` |
| N API × N IDLE           | IDLE только worker + Redis lock на ящик     |
| N worker × один IDLE     | один lock holder, heartbeat                 |
| Pub/Sub шторм            | тот же sync jobId                           |
| Poll + IDLE одновременно | тот же sync jobId, upsert идемпотентен      |
| API горизонтально        | только HTTP/enqueue, без сокетов IMAP       |

---

## 11. Восстановление после сбоев

| Сбой                    | Поведение                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Redis down в production | HTTP не шлёт почту сам; `QUEUED`/команда видны; когда Redis жив — reconcile доставляет job             |
| Gmail API down          | sync/send retry; ящик `DEGRADED`; poll продолжает пытаться                                             |
| SMTP down               | send retry; письмо не `SENT`                                                                           |
| IMAP disconnect         | backoff + lock refresh; poll подхватит письма                                                          |
| OAuth revoke            | `NEEDS_RECONNECT`, стоп watch/IDLE/send                                                                |
| Rate limit              | transient retry                                                                                        |
| Worker restart          | BullMQ заново отдаёт active job; send защищён статусом; IDLE перехватывает другой worker по stale lock |
| API restart             | webhook и REST поднимаются; IDLE не привязан к API                                                     |
| DB transient            | throw, retry job                                                                                       |
| Watch истёк             | hourly renew + poll как сетка                                                                          |
| historyId протух        | recovery-окно 30 писем                                                                                 |

«Без потери писем» значит: письмо, которое есть у провайдера в окне sync, появляется в NBOS не позже одного успешного poll/IDLE/push после восстановления. Не «в ту же секунду».

---

## 12. Наблюдаемость

Не новая метрическая платформа. Доводим то, что уже есть.

**Писать в `MailSyncLog`:** `SYNC_*`, `WATCH_RENEWED`, `CONNECTION_*`, `RECONNECT_REQUIRED`. Добавить виды: `IDLE_STARTED`, `IDLE_RECONNECT`, `POLL_ENQUEUED` (poll можно не спамить на каждый ящик — один summary log или только failures).

**Писать в `MailDeliveryLog`:** queued / sent / failed / cancelled / reset; убрать `OUTBOUND_SEND_STUB_FAILED`. Добавить `OUTCOME_UNKNOWN`.

**Health summary** расширить (без live IMAP probe в HTTP):

- `lastSyncAt`, `lastErrorAt`, `lastErrorMessage`
- `watchExpiresAt` / `watch: not_configured | active | expired`
- `idle: held | none`, `idleHeartbeatAt`
- `degraded` / `needs_reconnect`
- счётчики threads как сейчас

**Логи worker:** существующий `logBullmqJob` + `mailAccountId`, `messageId`, `errorClass` (transient|auth|permanent|ambiguous), без паролей и raw MIME.

По письму в UI уже есть delivery log. По ящику — sync logs. Этого достаточно, чтобы ответить «почему не пришло / не ушло».

---

## 13. Что удаляем

| Удалить                                                       | Замена                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `POST /mail/accounts/:id/sync-stub`                           | только `POST …/sync` → enqueue (**удаление stub — срез B**; в A убрать вызовы из UI) |
| `POST …/finalize-send-stub`                                   | настоящий worker send                                                                |
| `POST …/messages/:id/queue` как HTTP-send провайдеру          | тот же endpoint остаётся: только `DRAFT→QUEUED` + `enqueueSend`                      |
| Inline `sendQueuedMessage` из HTTP в production               | `enqueueSend`                                                                        |
| Inline `syncAccount` из Pub/Sub / IDLE / connect в production | `enqueueSync`                                                                        |
| `MailImapIdleService` на API                                  | тот же сервис на worker + lock                                                       |
| Мёртвый `enqueueSend` «есть, но не вызывается»                | единственный путь send                                                               |
| Web-кнопки stub sync / finalize-stub                          | Sync + Send/Retry                                                                    |

`queueOutboundDraftMessage` как **DB-хелпер** (`DRAFT→QUEUED`) остаётся внутри compose/retry. Это не BullMQ и не stub.

---

## 14. Схема и контракт API

Минимальные изменения БД:

**Срез A:**

1. `EmailDeliveryStatus` + `SENDING`.
2. `MailDeliveryLogKind`: убрать использование stub; добавить `OUTCOME_UNKNOWN`.

**Срез B (не в этом PR):**

3. `@@unique([mailAccountId, providerMessageId])` на `EmailMessage` (nullable provider id не участвует в конфликте — для исходящих до send id может быть null; unique partial, если движок требует: unique где `provider_message_id IS NOT NULL`).
4. `MailProviderConnection.imapIdleHeartbeatAt` (optional) — только если нужен health UI; иначе Redis-only.
5. `MailSyncLogKind`: `IDLE_STARTED`, `IDLE_RECONNECT` по необходимости.

**Срез C (не в этом PR):**

6. `EmailAttachment.fileAssetId` optional.

API:

- `POST /mail/compose`, `POST /mail/threads/:id/reply` — **200** + thread, `deliveryStatus=QUEUED` когда job принят; **503** если в production enqueue не встал (строка `QUEUED` остаётся) или persist упал (строки нет).
- `POST /mail/accounts/:id/sync` — `{ queued: true }` при принятом job; **503** если очередь недоступна (срез B не меняет этот контракт в A).
- `POST /mail/pubsub/google` — без изменений контракта.
- `POST /mail/threads/:id/messages/:id/retry-send` — из `FAILED` в очередь.
- Health/sync-logs — расширенные поля.
- Удалить stub routes.

Web (в том же контуре, иначе UI врёт):

- compose/reply не ждут SENT;
- после мутации invalidate thread;
- убрать stub-кнопки;
- показать QUEUED / SENDING / FAILED / retry.

---

## 15. Безопасность (без расширения scope)

Уже есть и сохраняем: AES-256-GCM секреты, RBAC send отдельно от read, sanitize HTML, rate limit compose, refresh token only для Gmail, audit send.

Добавляем аккуратность:

- в логах нет паролей, refresh token, raw MIME;
- Pub/Sub без валидного token — 401;
- `NEEDS_RECONNECT` не светит секрет в `lastErrorMessage` (обрезать provider text).

---

## 16. Порядок поставки

Три reviewable среза. Каждый сам по себе можно выкатить. Срезы B и C не начинать «вперемешку» в одном PR с A.

### Срез A — отправка и дисциплина очереди

Цель: HTTP больше не ждёт провайдера; double-send невозможен; ретраи реальные.

Зафиксированные развилки A (без «или»):

- Production после persist: enqueue fail → **оставить QUEUED**, HTTP **503**. Не inline-send. Не rollback в DRAFT.
- Успешный enqueue → HTTP **200** + `deliveryStatus=QUEUED` (не 202).
- Local без Redis (`NODE_ENV !== production`): inline fallback + лог `mail.inline_fallback`.
- `ensureIdle` / IMAP IDLE — **не A** (срез B, side-effect connect-sync).
- Orphan-QUEUED (>60 с) — **в A**: cron `*/2 * * * *`, флаг default **off**. Inbox poll 5 мин — **не A**.

Объём A:

- `SENDING` + unique outbound jobId + условный UPDATE.
- compose/reply → QUEUED → `enqueueSend`.
- Worker реально шлёт + **outbound вложения**.
- Классификация ошибок + throw transient.
- Production без inline send.
- Orphan-QUEUED / stale-SENDING reconcile.
- Удалить finalize-stub и HTTP-inline send. `sync-stub` route можно оставить (удаление — срез B).
- `POST …/queue` оставить как реальный DRAFT→QUEUED+enqueue.
- `POST …/retry-send` FAILED→QUEUED+enqueue.
- Тесты: идемпотентный send (3 retry / 1 SMTP), SENT не шлётся снова, ambiguous не ретраится, Redis down в prod не вызывает SMTP.
- Web: async статус; убрать вызовы finalize-stub / sync-stub.

### Срез B — получение

Цель: новые ящики без рестарта; push/IDLE живые; poll как сетка; нет дублей inbound.

- Unique inbound.
- Gmail watch start + hourly renew + history recovery.
- Auth → `NEEDS_RECONNECT`.
- IDLE на worker + Redis lock + backoff + watchdog.
- `ensureIdle` сразу после connect.
- Poll cron в roster + flag.
- Production без inline sync.
- Удалить sync-stub.
- Тесты: history 410, UIDVALIDITY reset, два enqueue = один sync, lock не даёт второй IMAP, poll идемпотентен.

### Срез C — inbound вложения и диагностика

- Optional `fileAssetId`, download job, лимит 25 MiB, retry.
- Health: watch / idle / last error.
- Логи errorClass.
- Письмо видно при FAILED download.

Критерий «почтовый модуль закрыт» = **A + B + C**.  
Не объявлять модуль закрытым после одного A.

---

## 17. Тесты (минимум)

| Слой      | Обязательное                                                              |
| --------- | ------------------------------------------------------------------------- |
| Unit      | `classifyMailProviderError`; fetch plan UIDVALIDITY; jobId стабилен       |
| Ops       | upsert не создаёт дубль; `QUEUED→SENDING` при гонке один победитель       |
| Worker    | mock adapter: send один раз на три attempt; sync swallow больше нет       |
| Scheduler | renew выбирает только истекающие watch; poll не трогает `NEEDS_RECONNECT` |
| HTTP      | compose не вызывает `sendMessage`; 503/queued без Redis в prod-режиме     |
| Web       | нет вызовов `sync-stub` / `finalize-send-stub`                            |

Живой Gmail/IMAP в CI не обязателен. Адаптеры мокаются. Один ручной smoke на стейдже: connect, приход письма, reply, restart worker, повтор не дублирует.

---

## 18. Критерий готовности

Модуль закрыт, когда одновременно верно:

1. Письмо, пришедшее на активный ящик, оказывается в PostgreSQL через push/IDLE **или** не позже одного reconcile-poll после сбоя канала.
2. Compose/reply в production не открывает SMTP/Gmail в процессе API.
3. Transient-ошибка даёт повтор job, не «completed + FAILED с первой попытки».
4. Одно `EmailMessage` не может породить два успешных `sendMessage` при retry, рестарте worker и повторном enqueue.
5. Новый Gmail/IMAP ящик получает watch/IDLE/sync без рестарта API.
6. Две replica API не открывают IMAP. Две replica worker держат не больше одного IDLE на ящик.
7. Redis/Gmail/SMTP/IMAP/worker/API временный отказ → после восстановления работа продолжается без ручного «починить ящик», кроме `NEEDS_RECONNECT`.
8. В коде и UI нет production stub-flow.
9. По `messageId` / `mailAccountId` из delivery log + sync log + health можно сказать, на каком шаге обрыв.
10. Inbound вложение либо `READY` в Drive, либо видимый `FAILED` с причиной; письмо при этом читается.
11. Срезы A/B/C слиты; известных технических разрывов на каноническом контуре не осталось.

---

## 19. Значения, которые это ТЗ фиксирует

Чтобы не оставлять дыры «уточним потом»:

| Параметр                      | Значение                       |
| ----------------------------- | ------------------------------ |
| Initial / recovery окно       | 30 писем                       |
| Poll                          | каждые 5 минут                 |
| Watch renew                   | каждый час, если expiry < 24 ч |
| IDLE lock TTL                 | 90 с                           |
| IDLE heartbeat                | 30 с                           |
| IDLE backoff                  | 5–120 с, jitter 20 %           |
| IDLE watchdog тишины          | 10 минут                       |
| Orphan QUEUED                 | старше 60 с                    |
| Stale SENDING без provider id | 10 минут → снова QUEUED        |
| Вложение max                  | 25 MiB                         |
| Mail concurrency              | 5                              |
| Job attempts                  | 5, exp от 5 с                  |
| Pub/Sub auth                  | существующий query token       |

Флаги scheduler — в roster отдельными строками. `mail-outbound-reconcile` (срез A) и inbox poll / watch renew (срез B) **не** включать пакетом. Default всех новых mail-флагов — **off**.

---

## 20. Связанные документы

- `00-Mail-Overview.md` — зачем модуль
- `01-Mail-Accounts-and-Sync.md` — аккаунты и cursor
- `03-Mail-Architecture.md` — adapters, SoT, очередь как канон
- `04-Mail-Integrations.md` — Drive / Credentials / CRM границы
- `06-Mail-Security-Stance.md` — секреты и sanitize
- `docs/NBOS/00-Technical-Decisions-By-Module.md` — Mail: BullMQ для sync/send
- `docs/architecture/scheduler-cron-roster.md` — куда вписать новые cron
- `docs/architecture/bullmq-idempotency-review.md` — закрыть зафиксированный gap send

После реализации обновить `06-Implementation-Status.md` и `99-Mail-Cleanup-Register.md` под фактический runtime (сейчас они отстают от кода).
