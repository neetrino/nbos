# NotificationInboxState READ rollout

## Staging

### Stage A — WRITE + reconcile

```env
NOTIFICATION_INBOX_STATE_WRITE_ENABLED=true
NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED=true
NOTIFICATION_INBOX_STATE_READ_ENABLED=false
NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED=false
```

```bash
pnpm notifications:inbox:check
# expect drifted=0 missing=0 negative=0 → readiness READY
# else: pnpm notifications:inbox:repair && check again
```

### Stage B — shadow (staging only, sample=1)

```env
NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED=true
NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE=1
```

Exercise create / bulk / mark / mark-all / archive / SSE reconnect / API restart. Expect shadow mismatches = 0.

### Stage C — READ on staging

```env
NOTIFICATION_INBOX_STATE_READ_ENABLED=true
NOTIFICATION_SSE_FROM_INBOX_STATE_ENABLED=true
```

Verify unread GET uses InboxState (no hot-path COUNT when row exists), version persists across API restart, missing-state repair works.

## Production

### Stage D — shadow canary

```env
NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED=true
NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE=0.05
NOTIFICATION_INBOX_STATE_READ_ENABLED=false
```

Record sampled reads, mismatches, fallbacks, COUNT p95 vs InboxState p95.

### Stage E — READ

After readiness report READY:

```env
NOTIFICATION_INBOX_STATE_READ_ENABLED=true
```

Prefer one API canary replica first, then all.

## Rollback

```env
NOTIFICATION_INBOX_STATE_READ_ENABLED=false
```

Keep WRITE + RECONCILE unless writes themselves are broken.

## Related Phase 5 flags (document actual env; do not assume enabled)

```env
NOTIFICATION_COMMAND_V2_ENABLED=
NOTIFICATION_BULK_WRITE_ENABLED=
NOTIFICATION_SSE_FROM_INBOX_STATE_ENABLED=
NOTIFICATION_ENQUEUE_RECONCILE_ENABLED=
```

## Legacy cleanup

Do **not** remove COUNT in this release. Separate cleanup after sustained production READ with zero drift/fallback.
