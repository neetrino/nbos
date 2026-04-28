ALTER TABLE "deals"
ADD COLUMN "maintenance_start_at" TIMESTAMP(3);

CREATE TYPE "SubscriptionStatusEnum_new" AS ENUM (
  'PENDING',
  'ACTIVE',
  'ON_HOLD',
  'CANCELLED',
  'COMPLETED'
);

ALTER TABLE "subscriptions"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "subscriptions"
ALTER COLUMN "status" TYPE "SubscriptionStatusEnum_new"
USING (
  CASE
    WHEN "status"::text = 'PAUSED' THEN 'ON_HOLD'
    ELSE "status"::text
  END
)::"SubscriptionStatusEnum_new";

DROP TYPE "SubscriptionStatusEnum";

ALTER TYPE "SubscriptionStatusEnum_new"
RENAME TO "SubscriptionStatusEnum";

ALTER TABLE "subscriptions"
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
