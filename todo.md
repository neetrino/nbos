# Mail Security — план доработок

> Основано на аудите безопасности модуля Mail (июнь 2026).  
> Цель: закрыть пробелы между текущей реализацией и каноном `docs/NBOS/02-Modules/17-Mail/*`.

---

## Резюме

| Область                                      | Статус         |
| -------------------------------------------- | -------------- |
| Секреты провайдера (AES-256-GCM + scrypt v2) | ✅ Сделано     |
| HTML/XSS санитизация (server + client)       | ✅ Сделано     |
| RBAC send на compose/reply                   | ✅ Сделано     |
| RBAC send на draft/queue                     | ⬜ Нужно       |
| Rate limit на все send-пути                  | ⬜ Частично    |
| Legacy SHA-256 KDF → полная миграция v2      | ⬜ Нужно       |
| Key management (KMS / per-item DEK)          | ⬜ Долгий срок |
| Encryption at rest для тел писем             | ⬜ Долгий срок |

**SHA-256 не менять как «модель защиты»** — он используется только в legacy KDF для расшифровки старых blob. Секреты Mail шифруются (AES-256-GCM), не хешируются.

---

## ✅ Уже сделано (не трогать без причины)

### Секреты и криптография

- [x] `MailProviderSecret` — отдельная таблица, opaque blob, без plaintext на connection rows
- [x] `MailProviderSecretStore` — AES-256-GCM через `CREDENTIALS_ENCRYPTION_KEY`
- [x] v2 шифрование: scrypt (N=16384) + AES-256-GCM, формат `v2:iv:authTag:ciphertext`
- [x] Legacy decrypt path (SHA-256 KDF) для обратной совместимости
- [x] Production env validation: `CREDENTIALS_ENCRYPTION_KEY` обязателен, ≥32 символов
- [x] Unit-тесты `apps/api/src/common/utils/crypto.test.ts`

### OAuth Gmail

- [x] JWT-signed `state` с TTL 600 сек
- [x] Проверка granted scopes (`gmail.modify`)
- [x] Refresh token сохраняется через `MailProviderSecretStore`

### XSS / HTML

- [x] Серверная санитизация: `sanitizeEmailHtml` + DOMPurify allowlist
- [x] Inbound sync: HTML санитизируется перед записью в `bodyHtmlSanitized`
- [x] Outbound draft: HTML санитизируется в `persistOutboundDraftMessage`
- [x] Клиентская повторная санитизация (defense-in-depth)
- [x] Тесты `mail-html-sanitize.test.ts`

### RBAC и аудит (частично)

- [x] Роли mailbox: OWNER / ADMIN / SENDER / READER
- [x] `mailRoleCanSend` на `compose` и `reply` (`mail-compose.service.ts`)
- [x] Rate limit 20 req/min на compose/reply (`mail-collab.controller.ts`)
- [x] Audit: connect, disconnect, send, draft created, queue, cancel
- [x] Sync/delivery logs без секретов (по дизайну схемы)
- [x] IMAP logger отключён; TLS по умолчанию для IMAP/SMTP

---

## ⬜ Нужно завершить

### P0 — RBAC send на draft/queue

**Проблема:** READER может создать draft и поставить в очередь — обход канона «send permission отделён от read».

**Файлы:**

- `apps/api/src/modules/mail/mail-outbound-mutation.service.ts` — `createOutboundDraft`
- `apps/api/src/modules/mail/mail-outbound-send-mutation.service.ts` — `queueOutboundDraft`
- Тесты (новые или расширить существующие)

**Задачи:**

- [ ] В `createOutboundDraft`: после `getMailThreadWithMailboxAccess` загрузить роль через `loadMailAccountWithViewerRole` и проверить `mailRoleCanSend`; иначе `403 Forbidden`
- [ ] В `queueOutboundDraft`: аналогичная проверка до `queueOutboundDraftMessage`
- [ ] Убедиться, что worker/async send не обходит RBAC (если queue станет фоновым — проверка при enqueue, не только при compose)
- [ ] Тесты: READER → 403 на draft create и queue; SENDER/OWNER/ADMIN → 200

**Критерий готовности:** пользователь с ролью READER не может ни создать outbound draft, ни поставить draft в очередь.

---

### P1 — Rate limit на все send-пути

**Проблема:** Throttle только на compose/reply; draft/queue endpoints без лимита.

**Файлы:**

- `apps/api/src/modules/mail/mail.controller.ts`

**Задачи:**

- [ ] Добавить `@Throttle({ default: { limit: 20, ttl: 60_000 } })` на:
  - `POST threads/:threadId/drafts`
  - `POST threads/:threadId/messages/:messageId/queue`
- [ ] Сверить с каноном: rate limit на send endpoints (`17-Mail/03-Mail-Architecture.md`)

**Критерий готовности:** все публичные send-related endpoints имеют throttle 20/min.

---

### P1 — Миграция legacy SHA-256 KDF → v2

**Проблема:** `deriveLegacyKey` (SHA-256) всё ещё активен для старых blob. Новые записи уже v2, но legacy path не удалён.

**Файлы:**

- `apps/api/src/common/utils/crypto.ts`
- `apps/api/src/modules/mail/providers/mail-provider-secret.store.ts`
- Миграционный скрипт (one-off job или admin command)

**Задачи:**

- [ ] Скрипт: прочитать все `MailProviderSecret`, если blob без префикса `v2:` — decrypt legacy → re-encrypt v2 → update row
- [ ] Аналогично для `Credential` secret fields (если есть legacy blob) — единый crypto stack
- [ ] После 100% миграции в prod: удалить `deriveLegacyKey` и legacy decrypt branch
- [ ] Обновить `crypto.test.ts` — legacy тесты оставить до удаления или пометить deprecated

**Критерий готовности:** в БД нет unversioned blob; `decrypt()` не использует SHA-256 KDF.

---

### P1 — Gmail access token: не кэшировать в blob

**Проблема:** В `MailProviderSecret` для Gmail хранятся `refreshToken` + `accessToken` + `expiryDate`. Access token короткоживущий; хранение увеличивает поверхность при decrypt.

**Файлы:**

- `apps/api/src/modules/mail/providers/mail-provider-secret.store.ts` (тип `GmailMailSecret`)
- `apps/api/src/modules/mail/mail-gmail-oauth.service.ts`
- `apps/api/src/modules/mail/providers/gmail.adapter.ts`

**Задачи:**

- [ ] Хранить в blob только `refreshToken` (минимальный набор)
- [ ] Access token получать on-demand через refresh при каждом adapter call
- [ ] Миграция существующих blob: при следующем OAuth reconnect или lazy cleanup при read

**Критерий готовности:** encrypted blob содержит только refresh token; access не персистится.

---

### P2 — Документация wide RBAC scope

**Проблема:** `MAIL VIEW scope=ALL|DEPARTMENT` даёт роль ADMIN на все mailbox, включая send. Это может быть намеренно, но не задокументировано.

**Задачи:**

- [ ] Зафиксировать в `docs/NBOS/02-Modules/17-Mail/05-Mail-Permissions-and-UX.md` поведение wide scope
- [ ] Решение: оставить как есть / ограничить send для wide scope — согласовать с owner

---

### P2 — Audit на decrypt секретов (опционально)

**Проблема:** Фоновый sync/send читает секреты без audit-события. Для compliance может понадобиться.

**Задачи:**

- [ ] Оценить необходимость (только если требует compliance/policy)
- [ ] Если да: lightweight audit `mail.secret.decrypted` без plaintext (mailAccountId, kind, actor=system)

---

## 🔮 Долгий срок (не MVP)

### Field-level encryption для тел писем

**Контекст:** `bodyText` и `bodyHtmlSanitized` в PostgreSQL в plaintext. При утечке дампа БД письма читаемы (секреты провайдера — нет).

**Варианты:**

1. Per-mailbox или per-org DEK + AES для body fields
2. PostgreSQL TDE (инфраструктурный уровень)
3. Оставить как есть + строгий RBAC + backup encryption

**Задачи (когда будет решение):**

- [ ] ADR / запись в `docs/NBOS/00-Technical-Decisions-By-Module.md`
- [ ] Схема миграции и key rotation
- [ ] Реализация encrypt/decrypt на read/write path

---

### Key management: KMS / per-item DEK

**Контекст:** Канон Credentials целевая модель — per-item DEK, master key / KMS отдельно от БД, rotation.

**Задачи:**

- [ ] Выбор: AWS KMS / HashiCorp Vault / cloud provider KMS
- [ ] Envelope encryption для `MailProviderSecret` и Credentials
- [ ] Key rotation runbook
- [ ] Обновить `docs/security.todo.md` (секция 10.x)

---

## Порядок реализации (рекомендуемый)

```text
1. P0  RBAC send на draft/queue + тесты
2. P1  Rate limit на draft/queue endpoints
3. P1  Gmail blob: только refresh token
4. P1  Legacy v2 migration script + удаление SHA-256 KDF
5. P2  Документация wide scope
6. —   Долгий срок: body encryption, KMS (отдельный slice после решения owner)
```

---

## Связанные файлы (справочник)

| Область            | Путь                                                                |
| ------------------ | ------------------------------------------------------------------- |
| Crypto core        | `apps/api/src/common/utils/crypto.ts`                               |
| Mail secrets       | `apps/api/src/modules/mail/providers/mail-provider-secret.store.ts` |
| Send RBAC policy   | `apps/api/src/modules/mail/mail-access.policy.ts`                   |
| Compose (send OK)  | `apps/api/src/modules/mail/mail-compose.service.ts`                 |
| Draft (send gap)   | `apps/api/src/modules/mail/mail-outbound-mutation.service.ts`       |
| Queue (send gap)   | `apps/api/src/modules/mail/mail-outbound-send-mutation.service.ts`  |
| Controllers        | `mail.controller.ts`, `mail-collab.controller.ts`                   |
| HTML sanitize      | `apps/api/src/modules/mail/providers/mail-html-sanitize.ts`         |
| Канон Mail         | `docs/NBOS/02-Modules/17-Mail/`                                     |
| Security checklist | `docs/security.todo.md`                                             |

---

## Чеклист перед закрытием всего плана

- [ ] P0 RBAC: тесты зелёные, READER не может draft/queue
- [ ] P1 Throttle: все send endpoints под rate limit
- [ ] P1 Legacy migration: 0 legacy blob в prod
- [ ] P1 Gmail blob: только refresh token
- [ ] `docs/security.todo.md` обновлён (если менялось поведение)
- [ ] Канон Mail permissions синхронизирован с кодом
