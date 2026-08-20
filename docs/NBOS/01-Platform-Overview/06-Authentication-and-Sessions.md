# Authentication and Sessions (V2)

> Platform identity for web, mobile, and Messenger. **Canon.**  
> Operational flags: [`docs/architecture/auth-session-v2-rollout.md`](../../architecture/auth-session-v2-rollout.md).  
> RBAC: [`../02-Modules/16-Settings-Admin/02-Permissions-RBAC.md`](../02-Modules/16-Settings-Admin/02-Permissions-RBAC.md).  
> Sessions UI: [`../05-UI-Specifications/12-Account-Security-Sessions.md`](../05-UI-Specifications/12-Account-Security-Sessions.md).

**Date:** 2026-08-20  
**Status:** accepted — implement against this file; do not invent a second login system.

---

## 1. Purpose

NBOS authenticates **employees**, not customers. One identity serves:

- Web (`apps/web`);
- Work mobile app;
- Messenger mobile app;
- Credentials / password-delivery mobile app;
- Messenger realtime (Socket.IO);
- Internal APIs.

The system must provide secure login, server-side sessions, per-device revoke, a short access-token lifetime, and a clean split from RBAC.

---

## 2. Architecture decision

```text
Server-side Auth Session
  + short-lived access JWT
  + rotating opaque refresh
  + RBAC loaded from PostgreSQL
```

| Layer | Source of truth |
| --- | --- |
| Who is signed in | `AuthSession` row (`ACTIVE`, not expired) |
| Who is this employee | `Employee.id` (`sub` on the access JWT) |
| What can they do | Role → permissions in PostgreSQL (`EmployeeGuard`) |

The access JWT is a **temporary ticket**. It must not carry roles, permissions, money, or secrets.

Do **not** replace this with a separate OAuth/IdP for mobile. Do **not** give the three mobile apps a different user table.

---

## 3. Authentication vs authorization

| | Authentication | Authorization |
| --- | --- | --- |
| Question | Who is this? | What may they do? |
| Owns | Login, password, sessions, tokens, devices, auth events | Roles, permissions, module/record scopes |
| Must not contain | Business permissions | Long-lived access secrets |

Permissions stay in the database. A role change takes effect within the EmployeeGuard cache window (≤60s). No `authVersion` bump is required for RBAC freshness.

---

## 4. Clients

Same `Employee`. **One login = one `AuthSession`.** Three apps on one phone = three sessions.

| `clientKind` | Surface | Refresh transport |
| --- | --- | --- |
| `web` | Next.js + BFF | HttpOnly cookie / BFF body. **Never** in public JSON. |
| `mobile_work` | Main work app | Refresh in login/refresh **JSON**; store in Keychain / Keystore |
| `mobile_messenger` | Chat app | Same as `mobile_work` |
| `mobile_vault` | Password delivery | Same as `mobile_work` |

Native clients send `clientKind` (and optional `deviceLabel`) on login. Browser login is always `web`.

SSO across the three apps is **out of scope** for V2. Shared Keychain can be added later without changing the session model.

---

## 5. Core entities

### 5.1 Employee

Existing HR entity. Do not invent extra statuses.

| Field | Role in auth |
| --- | --- |
| `id` | Identity (`sub`) |
| `email` | Login identifier (normalized lower-case) |
| `passwordHash` | Argon2id. Null = cannot password-login (invite not accepted) |
| `status` | `ACTIVE` \| `PROBATION` \| `ON_LEAVE` \| `TERMINATED` |
| `roleId` | RBAC role (authorization, not the session) |
| `authVersion` | Bumped on password change/reset, terminate, logout-all, ownership transfer |

**Who may log in:** `ACTIVE`, `PROBATION`, `ON_LEAVE` with a password hash.  
**Who must not:** `TERMINATED`, missing hash, or invite not completed.

Invite-only onboarding stays on `Invitation` + `POST /api/v1/auth/accept-invite`. There is no `INVITED` / `SUSPENDED` employee status.

### 5.2 AuthSession

Created on every successful V2 login. Raw refresh is **never** stored.

| Persist | Do not persist |
| --- | --- |
| `id`, `employeeId`, `tokenFamilyId` | Raw refresh |
| `refreshTokenHash`, `previousRefreshHash`, `previousHashExpiresAt` | Raw IP / raw User-Agent |
| `status`, `expiresAt`, `lastUsedAt`, `revokedAt`, `revokeReason` | Roles / permissions |
| `createdIpHash`, `lastIpHash`, `userAgentHash` | Vault unlock state |
| `deviceLabel`, `clientKind` (required) | |

`clientKind` is the gap vs current schema: add it so the session list can show Web / Work / Messenger / Vault.

**Status**

| Status | Meaning |
| --- | --- |
| `ACTIVE` | Usable refresh family |
| `ROTATED` | Internal: previous refresh in grace window |
| `EXPIRED` | Past `expiresAt` (job 14) |
| `REVOKED` | Logout, logout-all, password, terminate, admin |
| `COMPROMISED` | Refresh reuse detected — family is dead |

### 5.3 PasswordResetToken

Already exists. Store `sha256(token)` only. One-time. Completing reset revokes all sessions and bumps `authVersion`.

---

## 6. Access token

Short-lived JWT. Default **600s**. Allowed range **300–900s** (`AUTH_ACCESS_TOKEN_TTL_SECONDS`).

**Claims (existing names — keep them):**

```text
sub            Employee.id
email          Employee.email
sid            AuthSession.id
typ            "access"
ver            2
authVersion    Employee.authVersion
jti            unique id (optional)
exp / iat      standard
```

Forbidden in the JWT: roles, permissions, finance, secrets, vault state.

**Ordinary API / Socket.IO:** verify signature, expiry, `typ`, `ver`. **No** Redis denylist. **No** PostgreSQL session read.

`authVersion` is enforced on **refresh**, not on every HTTP request.

Residual access after logout or terminate on ordinary routes is at most the access TTL. That is accepted. High-risk routes must not rely on it (see §12). `TERMINATED` is also blocked by `EmployeeGuard` (≤60s cache) even if the JWT is still valid.

---

## 7. Refresh token

Opaque `sessionId.secret`. Server stores only `HMAC/SHA` of the secret with `AUTH_REFRESH_TOKEN_PEPPER` (≥32 chars when V2 issue is on).

Default refresh TTL: **30 days**. Must be longer than access TTL.

**Rotation (every successful refresh):**

1. Validate session `ACTIVE` (or grace `ROTATED`), hash, expiry, employee not `TERMINATED`, `authVersion` still current.
2. Issue a new raw refresh; store new hash.
3. Keep the previous hash only for `AUTH_REFRESH_ROTATION_GRACE_SECONDS` (default 10) so parallel tabs do not false-trigger reuse.
4. Issue a new access JWT.

**Reuse detection:** a refresh that is neither current nor in-grace → mark session `COMPROMISED`, revoke that family, refuse further refresh. Employee must log in again.

---

## 8. Login

```text
email + password
  → find employee (generic 401 if missing / no hash / bad password)
  → reject TERMINATED
  → Argon2id verify
  → create AuthSession (clientKind + deviceLabel)
  → access JWT + refresh (transport per §4)
```

Public JSON **never** includes `refreshToken` for `web`. Native responses **may** include `refreshToken` in JSON.

Login errors must not distinguish “unknown email” from “wrong password”.

---

## 9. Logout and session control

| Action | Effect |
| --- | --- |
| Logout current | Revoke this `AuthSession`; clear web refresh cookie; legacy `jti` denylist if the caller is still on v1 |
| Logout other device | `DELETE /api/v1/auth/sessions/:id` — owner only |
| Logout all | Revoke all `ACTIVE` sessions; bump `authVersion`; clear vault unlock |

Logout-all is also the side effect of password change, password reset, terminate, and founder ownership transfer.

---

## 10. Employee terminate

`Employee.status = TERMINATED` (My Company offboarding):

1. Disable password login.
2. Revoke all `ACTIVE` sessions (`user_disabled`).
3. Bump `authVersion`.
4. `EmployeeGuard` rejects the employee (≤60s).

Do not leave a terminated employee able to refresh.

---

## 11. Password

- Hash: **Argon2id**. Never store or log plaintext.
- **Change:** verify current password → new hash → bump `authVersion` → revoke all sessions → caller signs in again.
- **Reset:** hashed one-time token by email → new password → revoke all sessions. Responses to “forgot password” stay generic (no email enumeration).

---

## 12. High-risk actions

Use `RequireActiveSessionGuard` (V2 `sid` + `ACTIVE` row). Do not register it globally.

Required for:

- role assignment;
- employee terminate / offboarding;
- Credentials reveal / copy / export (in addition to vault step-up);
- security settings that change auth policy;
- logout-all from another device (already authenticated; still V2 session).

Credentials **vault unlock** is a **separate** 24h server session. Login V2 does not replace it. Canon: [`../02-Modules/12-Credentials/03-Credentials-Security.md`](../02-Modules/12-Credentials/03-Credentials-Security.md).

---

## 13. Web

```text
Browser → Next.js BFF → Nest
```

- Access JWT lives in the encrypted Auth.js cookie (not `localStorage`, not `session()`).
- Refresh: Nest `Set-Cookie` (`HttpOnly`, `Secure` in prod, `SameSite=Lax`, path-scoped) and/or BFF `POST /api/v1/auth/refresh` with `X-Nbos-Bff: 1` + body token.
- Cookie refresh requires `Origin` / `Referer` in `CORS_ORIGIN`.
- Public Nest JSON never includes `refreshToken`.

---

## 14. Mobile

Same Nest routes. Differences:

- `clientKind` is one of `mobile_work` | `mobile_messenger` | `mobile_vault`;
- refresh is returned in JSON on login/refresh;
- OS secure storage only (Keychain / Keystore / EncryptedSharedPreferences);
- on 401, refresh once, then retry; if refresh fails, sign out;
- Messenger Socket.IO uses the **current** short access JWT and must refresh before reconnect when expired.

Do not ship mobile on legacy 7-day JWT.

---

## 15. Messenger

Messenger is not an identity provider.

```text
Employee → AuthSession → access JWT → Socket.IO / Messenger APIs
  → Messenger permissions (RBAC + conversation ACL)
```

No second password store. No messenger-only user.

---

## 16. Audit

Record security events (no secrets, no raw refresh, no password, no token):

| Event | When |
| --- | --- |
| `auth.session_created` | V2 login |
| `auth.session_revoked` | Logout / revoke device |
| `auth.sessions_revoked` | Logout-all |
| `auth.user_disabled_sessions_revoked` | Terminate |
| `auth.password_changed` | Change password |
| `auth.password_reset_issued` / `_completed` | Reset |
| `auth.refresh_reuse_detected` | Stolen refresh replay |

Login failures stay metrics + generic 401 (no “user exists” audit line).

---

## 17. Scheduler job 14

`authSessionExpiryCleanup` — marks expired `ACTIVE` rows `EXPIRED`.

**Enable only when V2 sessions are being issued** (`AUTH_SESSION_V2_ISSUE_ENABLED=true` or native issue on). While everyone is on legacy JWT the job is idle and must stay **off**.

---

## 18. Legacy JWT (v1) — dual-run, then delete

Today production login is still long-lived JWT + Redis denylist. **Do not delete v1 until V2 is the only live login.**

| Phase | Rule |
| --- | --- |
| Dual-run | Flags default: issue/accept V2 **off**; legacy accept + denylist **on** |
| Canary | `AUTH_SESSION_V2_CANARY_USER_IDS` |
| All new logins V2 | Set `AUTH_LEGACY_ISSUANCE_DISABLED_AT` |
| Wait | `JWT_EXPIRES_IN` (default 7d) |
| Then | `AUTH_LEGACY_TOKEN_ACCEPT_ENABLED=false` → `AUTH_LEGACY_DENYLIST_READ_ENABLED=false` → delete v1 issue path and denylist reads |

Check: `pnpm auth:legacy-retirement-check`.  
Ops steps: [`docs/architecture/auth-session-v2-rollout.md`](../../architecture/auth-session-v2-rollout.md) stages A–H.

---

## 19. What already exists vs remaining

### Already in code (flags off — not live)

- `AuthSession` + `PasswordResetToken` models;
- V2 login/refresh/logout/logout-all;
- `GET/DELETE /api/v1/auth/sessions`;
- rotation, grace, reuse → `COMPROMISED`;
- hashed IP/UA, pepper, cookie + BFF CSRF;
- password change/reset revoke sessions;
- offboarding revokes sessions + bumps `authVersion`;
- `RequireActiveSessionGuard` (exported, not applied to high-risk routes);
- job 14 catalogued, `rosterIntent: off`;
- dual-path `AuthGuard` (v1 denylist / v2 claims).

### Remaining (this canon)

1. `clientKind` on `AuthSession` + login DTO;
2. Native JSON refresh profile (web stays cookie-only);
3. Populate `deviceLabel` from client / UA;
4. My Account **Active Sessions** UI;
5. Apply `RequireActiveSessionGuard` on §12 routes;
6. Put V2 flags in `.env.example`;
7. Roll out V2 (staging → canary → all), then enable job 14;
8. After TTL wait: remove legacy issue, accept, and denylist.

---

## 20. Tests (required)

| Area | Cases |
| --- | --- |
| Login | Valid; wrong password; no hash; `TERMINATED`; generic errors |
| Refresh | Rotate; expired; reuse → `COMPROMISED`; `TERMINATED` mid-session |
| Sessions | Create; revoke one; revoke all; list `current` |
| Password | Change and reset revoke all + bump `authVersion` |
| Transport | Web JSON has no refresh; native JSON has refresh |
| Guard | V2 ordinary request has no denylist GET; high-risk requires `ACTIVE` sid |

---

## 21. Definition of done

**V2 is the live login (web + any shipped native app) when:**

- New logins create `AuthSession`;
- Rotation and reuse detection work;
- Logout / logout-all / terminate / password change revoke sessions;
- Sessions are visible and revocable in My Account;
- RBAC stays out of the JWT;
- Mobile and Messenger use this identity;
- Job 14 is on;
- High-risk routes use an active-session check;
- Tests above pass.

**Legacy removal is a later DoD** (phase 3 in §18), not part of turning V2 on.

---

## 22. Implementation rules

1. Inspect current `apps/api/src/modules/auth/*` and `AuthGuard` before changing anything.
2. Extend V2. Do not add a third auth stack.
3. Do not delete legacy until §18 says so.
4. Do not check `AuthSession` on every ordinary request.
5. Do not put refresh in browser JSON or `localStorage`.
6. Do not store raw refresh, raw IP, or plaintext passwords.
7. Preserve working modules. Auth changes must not break BFF or Messenger handshake.
