# Mail Security Stance

> **Продуктовая позиция NBOS (2026-06):** Mail — рабочий inbox (удобство, sync, send), **не** password vault.  
> Секреты провайдера (IMAP-пароль, Gmail refresh token) хранятся как у Credentials — encrypted at rest.  
> Тела письем — plaintext в PostgreSQL + RBAC (достаточно для SMB без compliance на PII-at-rest).

---

## Реализовано (MVP gate — закрыто)

| Область             | Реализация                                                                              |
| ------------------- | --------------------------------------------------------------------------------------- |
| Секреты провайдера  | `MailProviderSecret` — AES-256-GCM, ключ через scrypt v2 (`CREDENTIALS_ENCRYPTION_KEY`) |
| Gmail OAuth         | JWT-signed `state`; в blob только `refreshToken` (access token — on-demand)             |
| Corporate IMAP/SMTP | Пароль только в encrypted blob, не на connection rows                                   |
| RBAC send           | `mailRoleCanSend` на compose, reply, **draft**, **queue**                               |
| Rate limit          | 20 req/min на compose, reply, draft, queue                                              |
| XSS                 | Server `sanitizeEmailHtml` + client DOMPurify (defense-in-depth)                        |
| Аудит               | connect, disconnect, outbound send/draft/queue                                          |
| Логи                | Секреты не пишутся в sync/delivery logs                                                 |
| Wide RBAC scope     | Документировано в `05-Mail-Permissions-and-UX.md` (`ALL`/`DEPARTMENT` → ADMIN)          |

Код: `apps/api/src/common/utils/crypto.ts`, `mail-provider-secret.store.ts`, `mail-send-access.ops.ts`, `mail-access.policy.ts`.

---

## Достаточно для текущей модели (не делать без причины)

Следующее **намеренно не входит** в MVP и **не требуется**, пока:

- почта используется как переписка, а не vault;
- пароли сервисов живут в **Credentials**, а не в txt/Drive/телах писем;
- нет внешнего compliance (банк, ISO, «дамп БД должен быть бесполезен»).

| Не делаем сейчас                 | Почему                                                                |
| -------------------------------- | --------------------------------------------------------------------- |
| KMS / HashiCorp Vault            | Один master key в env + backup — норма для SMB; KMS = инфра + runbook |
| Per-item DEK                     | Усложняет rotation без выигрыша на текущем масштабе                   |
| Field-level encryption тел писем | Ломает простой search/preview; RBAC + защита БД достаточны            |
| Audit на каждый decrypt при sync | Шум; секреты и так не в логах                                         |

Сравнение с прежней практикой (Bitrix-карточки, txt в Drive): NBOS для mailbox/credentials secrets **уже строже** (encrypted + RBAC), без усложнения UX.

---

## Минимальный ops-чеклист (prod)

1. `CREDENTIALS_ENCRYPTION_KEY` — ≥32 символов, `openssl rand -base64 32`, **сохранить в backup** (потеря = все секреты недоступны).
2. Ключ только в Coolify env api — не на web, не в git.
3. Не хранить пароли в телах писем и Drive txt — перенос в Credentials.
4. `MAIL` permission scope `OWN` для рядовых пользователей; `ALL`/`DEPARTMENT` — только у mail-админов.

См. также [`docs/deploy.md`](../../../deploy.md) §1 Security preflight.

---

## Опционально на будущее (только по запросу owner / compliance)

Записываем как **возможности**, не backlog MVP:

### A. KMS / envelope encryption

**Когда:** клиент или compliance требует отделить master key от БД; multi-tenant с жёстким SLA.

```text
KMS master key
  → per-tenant or per-item DEK
    → AES-256-GCM для MailProviderSecret + Credential fields
```

**Триггеры:** SOC2, аудит внешнего pentest, утечка env без компрометации KMS.

### B. Encryption at rest для тел писем

**Когда:** политика «дамп PostgreSQL не должен раскрывать body».

**Варианты:** per-mailbox DEK; PostgreSQL TDE (инфра); оставить plaintext + strict RBAC (текущий путь).

### C. Расширенный audit

**Когда:** нужен forensic trail на reveal/export секретов и emergency access (уже в каноне Credentials).

### D. AV scan вложений

**Когда:** входящие вложения от неизвестных отправителей — риск malware (см. `security.todo.md` §9.5).

---

## Связанные документы

- `03-Mail-Architecture.md` — security architecture (канон)
- `05-Mail-Permissions-and-UX.md` — роли и send permission
- `12-Credentials/03-Credentials-Security.md` — vault (общий crypto stack)
- `docs/security.todo.md` §10, §17-Mail
