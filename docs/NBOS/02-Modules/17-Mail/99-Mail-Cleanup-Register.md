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

| Area                 | Status    | Action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mail backend module  | `PARTIAL` | **2026-04-29:** `MailOutboundMutationService` (drafts) + **`MailOutboundSendMutationService`** (queue, finalize-stub, cancel, reset-failed) + in-app notify; **`GET …/threads`** paginated (`page`, `pageSize`, **`meta`**); **`GET …/threads/:id/messages/:mid/delivery-log`**; **`POST …/accounts/:id/sync-stub`**; **`GET …/accounts/health-summary`**; list `unreadOnly` + `needsLinkOnly` + **`q`**, **`PATCH …/threads/:id`**, mark-read + audits; без SMTP/sync/worker                   |
| Mail database schema | `PARTIAL` | **2026-04-29:** + `EmailDeliveryStatus` на `EmailMessage`; **2026-04-30:** + **`MailDeliveryLog`** (`MailDeliveryLogKind`) для исходящих шагов; **2026-04-30:** + **`MailProviderConnection`** boundary and **`EmailAttachment`** linked to Drive `FileAsset`; no real provider jobs yet                                                                                                                                                                                                        |
| Gmail adapter        | `MISSING` | Спроектировать OAuth scopes и adapter contract                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| IMAP/SMTP adapter    | `MISSING` | Спроектировать connection validation, sync cursor, send flow                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Queue jobs           | `MISSING` | Добавить jobs для sync, send, attachment download                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Mail UI              | `PARTIAL` | **2026-04-29:** inbox (stub **sync** per mailbox, All / Unread / **Needs link**, **subject search** debounced), thread (needs-link PATCH, **Queue**/Cancel draft, Finalize/Cancel queued, **Reset failed→draft**, reply, mark read); **2026-04-30:** per-mailbox **health summary**; **outbound delivery log**; **thread list Prev/Next + counts**; **provider connection state badge**; **message attachment list / draft FileAsset ids**; нет реальной отправки/settings/live provider health |
| Permissions          | `PARTIAL` | Модуль `MAIL` в seed RBAC (VIEW/EDIT/ADD/DELETE по матрице); list scoped ALL vs OWN mailbox owner; нет per-account roles из канона                                                                                                                                                                                                                                                                                                                                                              |
| Attachment pipeline  | `PARTIAL` | **2026-04-30:** `EmailAttachment` stores metadata and links messages to Drive `FileAsset`; outbound draft can attach existing FileAsset ids; provider download job remains missing                                                                                                                                                                                                                                                                                                              |
| Credentials boundary | `PARTIAL` | **2026-04-30:** `MailProviderConnection.credentialId` references Credentials; no token/password is stored in Mail; OAuth/IMAP setup UI and validation remain missing                                                                                                                                                                                                                                                                                                                            |
| Notifications events | `PARTIAL` | **2026-04-29:** in-app после `sync-stub`, **outbound draft**, **queue (DRAFT→QUEUED)**, **finalize-send-stub (FAILED)**, **cancel**, **reset-failed-to-draft** — актору (+ владелец ящика при отличии); **2026-04-30:** **`PATCH …/threads` `needsBusinessLink`** (flagged/cleared); `in_app_notifications` (Prisma); health/inbound/real sync — ещё `MISSING`                                                                                                                                  |

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
8. ~~Подключить Drive attachments.~~ **Partial 2026-04-30:** DB/API/UI references to Drive `FileAsset`; provider download remains later.
9. ~~Подключить Credentials boundary.~~ **Partial 2026-04-30:** `MailProviderConnection.credentialId`; setup/validation remains later.
10. Добавить admin health/error view.
