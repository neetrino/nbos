# Google Contacts sync

One-way phone book mirror: **NBOS Contacts → one org Google account**.

This is not a second CRM. Google is a calling directory for ATS.am CLIDs that look like `#077…`.

## Product rules

- Source of truth: NBOS `Contact`.
- Direction: NBOS → Google only. Edits in Google are overwritten on the next sync.
- Who: every **active** contact (`trashedAt` empty, not an absorbed merge card).
- Fields: given/family name, email, phones (primary + extras) **and** the Armenia ATS `#` twin.
- Trash / merge: **do not delete** the Google person. Merge updates the survivor only.
- If someone deletes the person in Google manually, the next NBOS sync **recreates** it (ATS lookup must keep working).
- Accounts: **one** org Google login. Extra destinations are later work, not this slice.
- Operators: **Founder / platform owner only** (`assertPlatformOwner`). Not `COMPANY EDIT`.

## Why `#` phones

ATS.am presents Armenian numbers as `#077961718`. The handset looks up the Google book, not NBOS. Without the `#` twin, caller ID is empty even when `+37477…` exists. WhatsApp and NBOS keep E.164.

Example: `+37477961718` → Google phones `+37477961718` and `#077961718`.

## Architecture

```text
Contact write (Clients + CRM)
  → BullMQ google.contacts-sync (concurrency 1, 1s gap)
  → Google People API createContact / updateContact
  → google_contact_mappings.contact_id → people/c…
```

OAuth uses the same `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` as Gmail, with a **separate** redirect and the `contacts` scope. Do not store this refresh token on a Mail mailbox row.

## Mapping

Postgres `GoogleContactMapping` is the link. Biography `NBOS Contact ID: {uuid}` is a backup only.

Reconnect:

- same Google email → keep mappings and update in place;
- different Google email → drop mappings and backfill into the new book.

Disconnect: drop the refresh token; keep mappings for a later reconnect of the same email.

## Out of scope

- Employee self-serve Google books
- Two-way sync
- Deletes in Google
- Company / notes / role on the Google person
- The old Bitrix Flask/PM2 sidecar
