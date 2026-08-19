# Mail Cleanup Register

Mail module является новым каноном. На момент создания документации полноценной реализации Mail в NBOS не зафиксировано.

Этот register нужен, чтобы при future gap-analysis не смешать Mail с Messenger, Notifications или generic email delivery.

## Status legend

| Status              | Значение                                 |
| ------------------- | ---------------------------------------- |
| `OK`                | Уже совпадает с каноном                  |
| `PARTIAL`           | Частично совпадает                       |
| `MISSING`           | Нужно добавить                           |
| `STALE`             | Устаревшая логика, нужно убрать/заменить |
| `BUSINESS DECISION` | Нужно отдельное решение owner            |

## Documentation cleanup

| Area                                      | Status | Action                                                                                                                                    |
| ----------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Mail module docs                          | `OK`   | Новый канон создан в `17-Mail`                                                                                                            |
| Documentation hub link                    | `OK`   | Mail добавлен в центральный указатель документации                                                                                        |
| Cross-links from Messenger                | `OK`   | **2026-04-30:** `09-Messenger/00-Messenger-Overview.md` + `04-Messenger-Integrations.md` (**Mail**); обратные ссылки в `17-Mail/00`, `04` |
| Cross-links from Notifications            | `OK`   | **2026-04-30:** `13-Notifications/01-Notifications-System.md` + `04-Notification-Integrations.md` — Mail inbox vs Email канал / in-app    |
| Cross-links from Credentials              | `OK`   | **2026-04-30:** `12-Credentials/05-Credentials-Integrations.md` (**Mail**) + `17-Mail/01` + `00` overview                                 |
| Cross-links from Drive                    | `OK`   | **2026-04-30:** `11-Drive/05-Drive-Module-Integrations.md` (**§13 Mail**) + `17-Mail/04`                                                  |
| Cross-links from Calendar                 | `OK`   | **2026-04-30:** `10-Calendar/05-Calendar-Integrations.md` (**Mail**); обратные ссылки в `17-Mail/00`, `04`                                |
| Cross-links from Technical Infrastructure | `OK`   | **2026-04-30:** `15-Technical-Infrastructure/04-Technical-Integrations.md` (**Mail**); обратные ссылки в `17-Mail/00`, `04`               |

## Runtime cleanup

| Area                 | Status    | Action                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mail backend module  | `PARTIAL` | **2026-08-19 Slice C:** inbound attachment download (`mail.attachment.download`, jobId `mail-att-{id}`), optional `fileAssetId`, 25 MiB cap, retry-download, worker `errorClass`. Slice B receive + Slice A send remain. Provider mailbox delete still later.                                                                                                  |
| Mail database schema | `PARTIAL` | **2026-08-19 Slice C:** `EmailAttachment.fileAssetId` optional (PENDING/FAILED inbound). Prior: `EmailDeliveryStatus` + `SENDING`, `MailDeliveryLog`, unique inbound, IDLE heartbeat.                                                                                                                                                                          |
| Gmail adapter        | `MISSING` | Спроектировать OAuth scopes и adapter contract                                                                                                                                                                                                                                                                                                                 |
| IMAP/SMTP adapter    | `MISSING` | Спроектировать connection validation, sync cursor, send flow                                                                                                                                                                                                                                                                                                   |
| Queue jobs           | `OK`      | **2026-08-19:** `mail.sync`, `mail.send`, `mail.attachment.download` on queue `mail`. Duplicate jobId while live = no-op.                                                                                                                                                                                                                                      |
| Mail UI              | `PARTIAL` | **2026-08-19 Slice C:** inbound attachment Pending / Ready / Failed + Retry; body stays readable. Prior: async send statuses, health watch/idle, inbox/thread. Settings / live provider probe still later.                                                                                                                                                     |
| Permissions          | `PARTIAL` | Модуль `MAIL` в seed RBAC (VIEW/EDIT/ADD/DELETE по матрице); list scoped ALL vs OWN mailbox owner; per-account roles (OWNER/ADMIN/SENDER/READER) в API                                                                                                                                                                                                         |
| Mail security (MVP)  | `OK`      | **2026-06:** encrypted provider secrets v2, RBAC send (incl. draft/queue), rate limit, HTML sanitize, Gmail refresh-only blob — см. `06-Mail-Security-Stance.md`                                                                                                                                                                                               |
| Attachment pipeline  | `OK`      | **2026-08-19 Slice C:** inbound metadata on sync → `mail.attachment.download` → Drive FileAsset → READY; oversize/permanent FAILED; retry-download. Outbound drafts still attach existing FileAsset ids (Slice A).                                                                                                                                             |
| Credentials boundary | `PARTIAL` | **2026-04-30:** `MailProviderConnection.credentialId` references Credentials; no token/password is stored in Mail; OAuth/IMAP setup UI and validation remain missing                                                                                                                                                                                           |
| Notifications events | `PARTIAL` | **2026-04-29:** in-app после `sync-stub`, **outbound draft**, **queue (DRAFT→QUEUED)**, **finalize-send-stub (FAILED)**, **cancel**, **reset-failed-to-draft** — актору (+ владелец ящика при отличии); **2026-04-30:** **`PATCH …/threads` `needsBusinessLink`** (flagged/cleared); `in_app_notifications` (Prisma); health/inbound/real sync — ещё `MISSING` |

## Business decisions needed before implementation

| Decision                            | Why it matters                                                             |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Historical import limit             | Full mailbox import может быть дорогим и медленным                         |
| Gmail OAuth scopes                  | Security-sensitive decision                                                |
| Corporate mailbox credential policy | Нужно решить app passwords vs mailbox passwords vs provider-specific setup |
| Sync frequency                      | Влияет на cost, rate limits и user expectations                            |
| Provider read-state sync            | Нужно ли менять read/unread обратно в Gmail/IMAP                           |
| Shared mailbox assignment           | Не входит в MVP, но может понадобиться support/sales                       |
| Email retention policy              | Нужно решить, как долго хранить локальную копию писем/attachments          |

## MVP backlog

1. Утвердить Mail как `17-Mail` module в roadmap.
2. Утвердить provider support: Gmail + corporate IMAP/SMTP.
3. Утвердить initial import limit и sync frequency.
4. Спроектировать Prisma schema.
5. Спроектировать provider adapter contract.
6. Реализовать backend sync/send jobs.
7. Реализовать inbox/thread UI.
8. ~~Подключить Drive attachments.~~ **2026-08-19 Slice C:** inbound download job + Drive FileAsset; outbound FileAsset ids already in Slice A.
9. ~~Подключить Credentials boundary.~~ **Partial 2026-04-30:** `MailProviderConnection.credentialId`; setup/validation remains later.
10. Добавить admin health/error view.
