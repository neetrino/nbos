# Auth permission consistency (Phase 8.15)

## Current semantics (unchanged by Phase 8)

| Layer                    | Behavior                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Access JWT               | Claims: `sub`, `email` (legacy); V2 adds `sid`, `typ`, `ver`, `authVersion`. **No permissions in JWT.**                       |
| Authorization            | `EmployeeGuard` loads role + permissions from PostgreSQL on each authenticated request (in-memory cache TTL **60s**).         |
| Role / permission change | Takes effect within ≤60s cache window. No `authVersion` bump required for RBAC freshness.                                     |
| Stale risk               | Privilege **escalation delay** ≤60s after revoke; **no multi-day JWT permission stale** because permissions are not embedded. |

## AuthSession V2 interaction

- Short access TTL (5–15 min) bounds residual access after logout when denylist is skipped for V2.
- `authVersion` is checked on **refresh** and bumped on disable / password-reset hooks; not on every HTTP request (avoids replacing Redis denylist with PG denylist).
- High-risk endpoints may use `RequireActiveSessionGuard` for explicit `AuthSession` ACTIVE check.

## Recommendation

Keep DB-backed permissions. Do not move permission lists into JWT without a separate design for invalidation.
