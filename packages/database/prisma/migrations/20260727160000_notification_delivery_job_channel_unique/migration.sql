-- Phase 5: idempotent delivery rows (jobId + channel).
-- Preflight: collapse duplicate (job_id, channel) keeping the earliest row.

DELETE FROM notification_deliveries d
USING notification_deliveries newer
WHERE d.job_id = newer.job_id
  AND d.channel = newer.channel
  AND d.created_at > newer.created_at;

DELETE FROM notification_deliveries d
WHERE d.id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY job_id, channel ORDER BY created_at ASC, id ASC) AS rn
    FROM notification_deliveries
  ) ranked
  WHERE ranked.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_job_channel_uid
  ON notification_deliveries (job_id, channel);
