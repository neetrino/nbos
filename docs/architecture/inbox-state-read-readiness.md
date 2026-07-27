# InboxState READ readiness (Phase 6.14)

**Status:** READ remains **disabled**. Do not set `NOTIFICATION_INBOX_STATE_READ_ENABLED=true` in Phase 6.

## Checklist before a future READ enablement release

| Signal                         | Current                                           | Target               |
| ------------------------------ | ------------------------------------------------- | -------------------- |
| Drift count (counter vs COUNT) | Measure via reconcile cron                        | 0 sustained          |
| Drift rate                     | UNKNOWN (staging)                                 | ~0                   |
| Last reconciliation            | Ops                                               | < 15–30 min          |
| Missing InboxState rows        | Reconcile creates                                 | 0                    |
| Negative counters              | CHECK constraint + reconcile                      | 0                    |
| SSE mutation accuracy          | Snapshot when `SSE_FROM_INBOX_STATE` on           | Matches dual-write   |
| Legacy COUNT p95               | UNKNOWN — measure with `DB_QUERY_METRICS_ENABLED` | Document before flip |

## Recommended decision

1. Enable WRITE + RECONCILE in staging; prove drift=0 for ≥1 week.
2. Enable SSE-from-inbox for mutation publish (Phase 5 flag).
3. Measure legacy COUNT frequency/p95 under production-like load.
4. **Separate release** flips READ only after report signed off.

Phase 6 only instruments and documents — it does **not** flip READ.
