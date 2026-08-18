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
- `enqueueSync` jobId `mail-sync:{accountId}`; production never inline-syncs (manual → 503).
- IMAP IDLE on worker only (Redis lock, cap 20, backoff, watchdog); Gmail `users.watch` after successful sync.
- Scheduler (default **off**): `mail-gmail-watch-renew` hourly, `mail-sync-reconcile` every 5 min.
- `POST …/sync-stub` removed. Health: watch `not_configured|active|expired`, idle heartbeat.

## Intentional placeholders / next slices

- Inbound attachment download job (`fileAssetId` optional) — Slice C.
- Provider mailbox delete — Cleanup Register.

## MVP assumptions (Trash)

- Trash is **NBOS-only** (no provider mailbox delete in MVP). Purge removes thread + cascaded messages/attachment rows; linked `FileAsset` blobs follow Drive retention separately.

## API routes (lifecycle)

- `mail/threads` — `scope`; `POST …/delete` (trash); `POST …/restore`; `DELETE …/permanent`.

## Related code

- API: `apps/api/src/modules/mail/mail-thread-trash.ops.ts`, `mail-thread-permanent-delete.ops.ts`, `mail-trash-purge.ops.ts`
- Web: `apps/web/src/features/mail/mail-folder-config.ts`, `MailThreadDetailContent.tsx`
