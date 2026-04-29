-- Outbound delivery pipeline: nullable for inbound messages

CREATE TYPE "EmailDeliveryStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENT', 'FAILED', 'CANCELLED');

ALTER TABLE "email_messages" ADD COLUMN "delivery_status" "EmailDeliveryStatus";

UPDATE "email_messages" SET "delivery_status" = 'SENT' WHERE "direction" = 'OUTBOUND';
