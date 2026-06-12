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

## Intentional placeholders / next slices

- Real SMTP/sync/worker, Gmail/IMAP adapters, provider mailbox delete — Cleanup Register.
- Attachment provider download job — metadata + Drive `FileAsset` link exists; download job missing.

## MVP assumptions (Trash)

- Trash is **NBOS-only** (no provider mailbox delete in MVP). Purge removes thread + cascaded messages/attachment rows; linked `FileAsset` blobs follow Drive retention separately.

## API routes (lifecycle)

- `mail/threads` — `scope`; `POST …/delete` (trash); `POST …/restore`; `DELETE …/permanent`.

## Related code

- API: `apps/api/src/modules/mail/mail-thread-trash.ops.ts`, `mail-thread-permanent-delete.ops.ts`, `mail-trash-purge.ops.ts`
- Web: `apps/web/src/features/mail/mail-folder-config.ts`, `MailThreadDetailContent.tsx`
