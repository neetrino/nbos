# AuthSession V2 rollout & rollback

**InboxState READ stays off:** do not set `NOTIFICATION_INBOX_STATE_READ_ENABLED=true` as part of this rollout.

## Flags (defaults)

```env
AUTH_SESSION_V2_ISSUE_ENABLED=false
AUTH_SESSION_V2_ACCEPT_ENABLED=false
AUTH_LEGACY_TOKEN_ACCEPT_ENABLED=true
AUTH_LEGACY_DENYLIST_READ_ENABLED=true
AUTH_REFRESH_REUSE_DETECTION_ENABLED=true
AUTH_ACCESS_TOKEN_TTL_SECONDS=600
AUTH_REFRESH_TOKEN_TTL_DAYS=30
AUTH_REFRESH_ROTATION_GRACE_SECONDS=10
AUTH_REFRESH_COOKIE_NAME=nbos_refresh
AUTH_REFRESH_TOKEN_PEPPER=   # required (≥32) when V2 issue on
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=true
AUTH_SESSION_V2_CANARY_USER_IDS=
AUTH_LEGACY_ISSUANCE_DISABLED_AT=
SCHEDULER_AUTH_SESSION_CLEANUP_ENABLED=false
AUTH_SESSION_CLEANUP_BATCH_SIZE=500
```

## CSRF strategy

**Variant C (BFF-only refresh) + Variant A (Origin/Referer):**

- Browser never sends refresh to Nest directly in the happy path.
- Next BFF calls `POST /api/v1/auth/refresh` with `X-Nbos-Bff: 1` and body token from encrypted Auth.js JWT.
- Cookie-based refresh requires Origin/Referer in `CORS_ORIGIN`.
- Refresh cookie `Path=/api/auth` (Nest Set-Cookie); primary storage for web is Auth.js encrypted JWT (`refreshToken` claim, not exposed to `session()`).

## Stages

| Stage | Action                                                                              |
| ----- | ----------------------------------------------------------------------------------- |
| A     | Deploy migration; all V2 flags false                                                |
| B     | `ACCEPT=true`, `ISSUE=false` — validate test tokens                                 |
| C     | Staging `ISSUE=true` + pepper/cookie name                                           |
| D     | Prod canary via `AUTH_SESSION_V2_CANARY_USER_IDS`                                   |
| E     | All new logins V2; set `AUTH_LEGACY_ISSUANCE_DISABLED_AT`                           |
| F     | Wait max legacy TTL (`JWT_EXPIRES_IN` at disable time)                              |
| G     | `AUTH_LEGACY_TOKEN_ACCEPT_ENABLED=false`                                            |
| H     | `AUTH_LEGACY_DENYLIST_READ_ENABLED=false` after `pnpm auth:legacy-retirement-check` |

## Rollback

| Symptom                | Action                                                   |
| ---------------------- | -------------------------------------------------------- |
| V2 login broken        | `AUTH_SESSION_V2_ISSUE_ENABLED=false`                    |
| Refresh broken         | Stop issue; keep accept; fix; do not delete rows         |
| SSE/Socket broken      | Keep legacy accept; fix BFF refresh                      |
| False reuse logouts    | `AUTH_REFRESH_REUSE_DETECTION_ENABLED=false` temporarily |
| Denylist off too early | `AUTH_LEGACY_DENYLIST_READ_ENABLED=true` immediately     |

## Earliest safe denylist removal

`AUTH_LEGACY_ISSUANCE_DISABLED_AT + JWT_EXPIRES_IN` (default 7d). Command: `pnpm auth:legacy-retirement-check`.
