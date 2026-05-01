-- Notifications P0: persisted engine foundation, dedupe and actionable in-app rows.

CREATE TYPE "NotificationJobStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'DELIVERED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "NotificationDeliveryChannel" AS ENUM (
  'IN_APP',
  'TELEGRAM',
  'WHATSAPP',
  'EMAIL'
);

CREATE TYPE "NotificationDeliveryStatus" AS ENUM (
  'PENDING',
  'DELIVERED',
  'FAILED',
  'SKIPPED'
);

ALTER TABLE "in_app_notifications"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'informational',
  ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN "action_label" TEXT,
  ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE TABLE "notification_events" (
  "id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "source_module" TEXT NOT NULL,
  "source_entity_type" TEXT,
  "source_entity_id" TEXT,
  "payload" JSONB,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idempotency_key" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_rules" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "recipient_resolver" TEXT NOT NULL DEFAULT 'ACTOR',
  "channels" TEXT[] NOT NULL DEFAULT ARRAY['IN_APP']::TEXT[],
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_jobs" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "rule_id" TEXT NOT NULL,
  "status" "NotificationJobStatus" NOT NULL DEFAULT 'PENDING',
  "scheduled_for" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "next_retry_at" TIMESTAMP(3),
  "dedupe_key" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),

  CONSTRAINT "notification_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_deliveries" (
  "id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "channel" "NotificationDeliveryChannel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT,
  "provider_message_id" TEXT,
  "error_code" TEXT,
  "error_message" TEXT,
  "sent_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_events_idempotency_key_key" ON "notification_events"("idempotency_key");
CREATE INDEX "notification_events_event_type_idx" ON "notification_events"("event_type");
CREATE INDEX "notification_events_source_module_idx" ON "notification_events"("source_module");
CREATE INDEX "notification_events_source_entity_type_source_entity_id_idx" ON "notification_events"("source_entity_type", "source_entity_id");
CREATE UNIQUE INDEX "notification_rules_code_key" ON "notification_rules"("code");
CREATE INDEX "notification_rules_event_type_idx" ON "notification_rules"("event_type");
CREATE INDEX "notification_rules_enabled_idx" ON "notification_rules"("enabled");
CREATE UNIQUE INDEX "notification_jobs_dedupe_key_key" ON "notification_jobs"("dedupe_key");
CREATE INDEX "notification_jobs_event_id_idx" ON "notification_jobs"("event_id");
CREATE INDEX "notification_jobs_rule_id_idx" ON "notification_jobs"("rule_id");
CREATE INDEX "notification_jobs_status_idx" ON "notification_jobs"("status");
CREATE INDEX "notification_jobs_scheduled_for_idx" ON "notification_jobs"("scheduled_for");
CREATE INDEX "notification_deliveries_job_id_idx" ON "notification_deliveries"("job_id");
CREATE INDEX "notification_deliveries_channel_idx" ON "notification_deliveries"("channel");
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries"("status");
CREATE INDEX "in_app_notifications_recipient_employee_id_archived_at_idx" ON "in_app_notifications"("recipient_employee_id", "archived_at");
CREATE INDEX "in_app_notifications_category_idx" ON "in_app_notifications"("category");
CREATE INDEX "in_app_notifications_priority_idx" ON "in_app_notifications"("priority");

ALTER TABLE "notification_jobs"
  ADD CONSTRAINT "notification_jobs_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_jobs"
  ADD CONSTRAINT "notification_jobs_rule_id_fkey"
  FOREIGN KEY ("rule_id") REFERENCES "notification_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notification_deliveries"
  ADD CONSTRAINT "notification_deliveries_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "notification_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
