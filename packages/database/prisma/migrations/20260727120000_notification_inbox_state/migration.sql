-- NotificationInboxState: materialized unread counter + monotonic version.
-- Backfill is set-based (no per-employee loop). Idempotent via ON CONFLICT.

CREATE TABLE IF NOT EXISTS "notification_inbox_state" (
  "employee_id" TEXT NOT NULL,
  "unread_count" INTEGER NOT NULL DEFAULT 0,
  "version" BIGINT NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_inbox_state_pkey" PRIMARY KEY ("employee_id"),
  CONSTRAINT "notification_inbox_state_unread_nonnegative"
    CHECK ("unread_count" >= 0)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_inbox_state_employee_id_fkey'
  ) THEN
    ALTER TABLE "notification_inbox_state"
      ADD CONSTRAINT "notification_inbox_state_employee_id_fkey"
      FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "notification_inbox_state" ("employee_id", "unread_count", "version", "updated_at")
SELECT
  e."id",
  COALESCE(u.unread_count, 0)::INTEGER,
  0,
  CURRENT_TIMESTAMP
FROM "employees" e
LEFT JOIN (
  SELECT
    n."recipient_employee_id" AS employee_id,
    COUNT(*)::INTEGER AS unread_count
  FROM "in_app_notifications" n
  WHERE n."is_read" = false
    AND n."archived_at" IS NULL
  GROUP BY n."recipient_employee_id"
) u ON u.employee_id = e."id"
ON CONFLICT ("employee_id") DO UPDATE
SET
  "unread_count" = EXCLUDED."unread_count",
  "updated_at" = CURRENT_TIMESTAMP
WHERE "notification_inbox_state"."unread_count" IS DISTINCT FROM EXCLUDED."unread_count";
