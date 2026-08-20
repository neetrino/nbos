# Account Security — Active Sessions

> UI for Authentication V2 sessions. Product canon: [`../01-Platform-Overview/06-Authentication-and-Sessions.md`](../01-Platform-Overview/06-Authentication-and-Sessions.md).

**Date:** 2026-08-20  
**Status:** accepted — not built yet (API `GET/DELETE /api/v1/auth/sessions` exists).

---

## Placement

**My Account → Security → Active Sessions.**

Not Settings. Settings → Security is platform defaults (TTL, future 2FA). Personal devices belong in the header **My Account** sheet, next to Change password.

---

## List

`GET /api/v1/auth/sessions` — caller’s `ACTIVE`, unexpired rows only.

Each row:

| Show     | Source                                                 |
| -------- | ------------------------------------------------------ |
| Client   | `clientKind` → Web / Work app / Messenger / Vault      |
| Device   | `deviceLabel` (e.g. “Chrome · macOS”, “iPhone”)        |
| Activity | “This device” if `current`; else relative `lastUsedAt` |
| Started  | `createdAt`                                            |

Do not show raw IP, hashes, refresh material, or `tokenFamilyId`.

---

## Actions

| Action                     | Behavior                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| Sign out this device       | `DELETE /api/v1/auth/sessions/:id`. If `current`, also run web logout (clear Auth.js + refresh cookie). |
| Sign out all other devices | Logout-all **except** current, or logout-all + immediate re-login. Prefer: revoke others, keep current. |
| Sign out everything        | Existing logout-all + full sign-in. Use after “I don’t recognize a device”.                             |

Confirm before revoke. Empty list after V2 is off / legacy-only: show “Session list is available after the new sign-in is enabled”, not a fake device.

---

## Empty / loading

- Loading: list skeleton, no invented devices.
- Error: retry. Do not claim devices were revoked.
- Legacy-only caller (`tokenVersion === 1`): no session rows — copy above.

---

## Copy

- Title: **Active sessions**
- Current badge: **This device**
- Revoke one: **Sign out**
- Revoke others: **Sign out other devices**
