# Notification data quality audit (Phase 5.18)

**Date:** 2026-07-27  
**Purpose:** Preflight before strict unique constraints / bulk write rollout.

## Preflight queries

### Duplicate NotificationJob.dedupeKey

Unique already exists on `notification_jobs.dedupe_key`. Confirm no orphans:

```sql
SELECT dedupe_key, count(*)
FROM notification_jobs
GROUP BY dedupe_key
HAVING count(*) > 1;
```

### Duplicate deliveries (job_id, channel)

```sql
SELECT job_id, channel, count(*)
FROM notification_deliveries
GROUP BY job_id, channel
HAVING count(*) > 1;
```

Migration `20260727160000_notification_delivery_job_channel_unique` deletes extras before creating unique index.

### Negative / drifted InboxState counters

```sql
SELECT employee_id, unread_count, version
FROM notification_inbox_state
WHERE unread_count < 0;

SELECT s.employee_id, s.unread_count AS counter, c.actual
FROM notification_inbox_state s
JOIN (
  SELECT recipient_employee_id AS employee_id, count(*)::int AS actual
  FROM in_app_notifications
  WHERE is_read = false AND archived_at IS NULL
  GROUP BY recipient_employee_id
) c ON c.employee_id = s.employee_id
WHERE s.unread_count <> c.actual;
```

Repair via `NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED=true` + scheduler reconcile.

### Notifications without recipient

FK cascade on `recipient_employee_id` — expect 0:

```sql
SELECT count(*) FROM in_app_notifications n
LEFT JOIN employees e ON e.id = n.recipient_employee_id
WHERE e.id IS NULL;
```

### Stale PENDING deliveries / jobs

In-app create path writes `DELIVERED`. PENDING rows are job-only reminder flows or failed external enqueue:

```sql
SELECT status, count(*) FROM notification_jobs GROUP BY status;
SELECT status, channel, count(*) FROM notification_deliveries GROUP BY status, channel;
```

Scan via `NOTIFICATION_ENQUEUE_RECONCILE_ENABLED` + `/scheduler/notification-enqueue-reconcile`.

## Idempotency strategy (Phase 5)

| Layer      | Key                                       | Mechanism                                                     |
| ---------- | ----------------------------------------- | ------------------------------------------------------------- |
| Job        | `NotificationJob.dedupeKey` unique        | Soft + hard dedupe for create                                 |
| Event      | `NotificationEvent.idempotencyKey` unique | Upsert / ON CONFLICT DO NOTHING                               |
| Delivery   | `(jobId, channel)` unique                 | Prevents duplicate channel rows on retry                      |
| In-app row | No unique on content                      | Identity tied to job dedupe; duplicate job → no second insert |

## Notes

- Do **not** add `recipientId + dedupeKey` unique on `in_app_notifications` until a dedicated `dedupe_key` column is backfilled.
- `NOTIFICATION_INBOX_STATE_READ_ENABLED` remains **false**.
