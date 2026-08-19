# Mail module — implementation status

Tracks **shipped runtime** vs `00-Mail-Overview.md`. Provider/sync gaps: `99-Mail-Cleanup-Register.md`.

## Shipped (web + API) — Trash (Phase 7.1)

- **Schema:** `email_threads.trashed_at`, `trashed_by_employee_id` (`20260612190000`).
- **API:** `POST /mail/threads/:id/delete` → move to Trash (not hard delete); `POST …/restore`; `DELETE …/permanent` (trashed-only, `MAIL DELETE`); list `?scope=active|trash`.
- **Web:** Mail sidebar **Trash** folder; detail — Move to Trash / Restore / **Delete permanently** (name-match confirm); active inbox excludes trashed threads.
- **Mutations on trashed threads:** blocked (reply, spam, assignment, outbound draft).
- **Retention purge:** `mail.thread_retention_purged` via unified platform job (30d; `PLATFORM_TRASH_RETENTION_DAYS_MAIL`).
- **Platform inventory:** `mail_thread` category.

## Shipped (MVP — partial)

- Inbox list, thread detail, outbound draft/queue stub, health summary, RBAC mailbox scope — see Cleanup Register §Runtime.

## Shipped — Mail runtime Slice B (receive)

- Unique inbound `(mailAccountId, providerMessageId)`; history 410 → last-30 recovery; UIDVALIDITY reset.
- `enqueueSync` jobId `mail-sync-{accountId}` (BullMQ forbids `:` in custom jobId); production never inline-syncs (manual → 503).
- IMAP IDLE on worker only (Redis lock, cap 20, backoff, watchdog); Gmail `users.watch` after successful sync.
- Scheduler (default **off**): `mail-gmail-watch-renew` hourly, `mail-sync-reconcile` every 5 min.
- `POST …/sync-stub` removed. Health: watch `not_configured|active|expired`, idle heartbeat.

## Shipped — Mail runtime Slice C (inbound attachments)

- `EmailAttachment.fileAssetId` optional; inbound rows start `PENDING` + `fileAssetId = null`.
- Sync persists attachment metadata only; `mail.attachment.download` jobId `mail-att-{attachmentId}`.
- Worker: `adapter.downloadAttachment` → Drive `FileAsset` (`MAIL` / `OTHER` / `RESTRICTED`) → `READY`. Cap **25 MiB**.
- Transient errors throw (BullMQ retry). Permanent / oversize / auth → `FAILED` (auth also `NEEDS_RECONNECT`); job completes.
- `POST …/attachments/:id/retry-download` (`FAILED → PENDING`, or re-enqueue `PENDING`) + enqueue. Production enqueue miss → **503**, row stays `PENDING`.
- UI: Pending / Ready / Failed; Retry for Failed and for Pending older than **3 min** (stuck / enqueue-miss). Body stays readable.
- Attachment enqueue replaces completed/failed BullMQ jobs (`mail-att-{id}`) so Retry actually runs. Sync unique-skip re-enqueues stuck PENDING (no `fileAsset`).
- Worker logs include `errorClass` when known. No new Mail cron flags.

## Shipped — unique live mailbox per email

- Canon: shared mailbox is one `MailAccount` + `MailAccountAccess`, not two owners Connecting the same address. Unique key is **global** `lower(email_address)` among live rows (`status <> DISABLED`), not `(owner, email)`.
- Migration `20260819183000_mail_accounts_live_email_unique` normalizes emails, disables extra live duplicates (keeps secret / last sync / newest), then creates partial unique index `mail_accounts_live_email_lower_uidx`. DISABLED leftovers (e.g. junk `test@`) may coexist.
- Corporate and Gmail Connect reuse the owner’s existing row (including `DISABLED`); another employee’s live mailbox of the same address → 409 (Gmail OAuth → `mailbox_already_connected`). Prod still needs `migrate deploy` of this migration.

## Shipped — corporate persist-on-fail + reconnect

- `POST /mail/accounts/corporate/connect` upserts the owner+email draft first (`NEEDS_RECONNECT`), then validates. Failure keeps the row; success promotes to `ACTIVE`.
- `POST /mail/accounts/:id/reconnect` accepts partial IMAP/SMTP fields; password optional when a secret exists.
- Web: Mail settings **Reconnect mailbox** prefills saved settings; switcher badges `Reconnect` / `Off` / `Degraded`. Daily switcher and All-inbox omit `DISABLED`; Delete mailbox disconnects the selected account (history kept).

## Intentional placeholders / next slices

- Provider mailbox delete — Cleanup Register.

## MVP assumptions (Trash)

- Trash is **NBOS-only** (no provider mailbox delete in MVP). Purge removes thread + cascaded messages/attachment rows; linked `FileAsset` blobs follow Drive retention separately.

## API routes (lifecycle)

- `mail/threads` — `scope`; `POST …/delete` (trash); `POST …/restore`; `DELETE …/permanent`.

## Related code

- API: `apps/api/src/modules/mail/mail-thread-trash.ops.ts`, `mail-thread-permanent-delete.ops.ts`, `mail-trash-purge.ops.ts`
- Web: `apps/web/src/features/mail/mail-folder-config.ts`, `MailThreadDetailContent.tsx`
