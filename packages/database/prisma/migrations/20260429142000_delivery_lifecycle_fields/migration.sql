-- Add canonical delivery lifecycle fields while keeping legacy status enums intact.
CREATE TYPE "DeliveryStageEnum" AS ENUM ('STARTING', 'DEVELOPMENT', 'QA', 'TRANSFER');
CREATE TYPE "DeliveryWorkStatusEnum" AS ENUM ('ACTIVE', 'ON_HOLD');
CREATE TYPE "DeliveryResolutionEnum" AS ENUM ('DONE', 'CANCELLED');

ALTER TABLE "products"
  ADD COLUMN "delivery_stage" "DeliveryStageEnum" DEFAULT 'STARTING',
  ADD COLUMN "delivery_work_status" "DeliveryWorkStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "delivery_resolution" "DeliveryResolutionEnum",
  ADD COLUMN "on_hold_reason" TEXT,
  ADD COLUMN "on_hold_until" TIMESTAMP(3),
  ADD COLUMN "cancellation_reason" TEXT;

ALTER TABLE "extensions"
  ADD COLUMN "delivery_stage" "DeliveryStageEnum" DEFAULT 'STARTING',
  ADD COLUMN "delivery_work_status" "DeliveryWorkStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "delivery_resolution" "DeliveryResolutionEnum",
  ADD COLUMN "on_hold_reason" TEXT,
  ADD COLUMN "on_hold_until" TIMESTAMP(3),
  ADD COLUMN "cancellation_reason" TEXT;

UPDATE "products"
SET
  "delivery_stage" = CASE
    WHEN "status" IN ('NEW', 'CREATING') THEN 'STARTING'::"DeliveryStageEnum"
    WHEN "status" IN ('DEVELOPMENT', 'QA', 'TRANSFER') THEN "status"::text::"DeliveryStageEnum"
    ELSE NULL
  END,
  "delivery_work_status" = CASE
    WHEN "status" = 'ON_HOLD' THEN 'ON_HOLD'::"DeliveryWorkStatusEnum"
    ELSE 'ACTIVE'::"DeliveryWorkStatusEnum"
  END,
  "delivery_resolution" = CASE
    WHEN "status" = 'DONE' THEN 'DONE'::"DeliveryResolutionEnum"
    WHEN "status" = 'LOST' THEN 'CANCELLED'::"DeliveryResolutionEnum"
    ELSE NULL
  END;

UPDATE "extensions"
SET
  "delivery_stage" = CASE
    WHEN "status" = 'NEW' THEN 'STARTING'::"DeliveryStageEnum"
    WHEN "status" IN ('DEVELOPMENT', 'QA', 'TRANSFER') THEN "status"::text::"DeliveryStageEnum"
    ELSE NULL
  END,
  "delivery_resolution" = CASE
    WHEN "status" = 'DONE' THEN 'DONE'::"DeliveryResolutionEnum"
    WHEN "status" = 'LOST' THEN 'CANCELLED'::"DeliveryResolutionEnum"
    ELSE NULL
  END;

CREATE INDEX "products_delivery_stage_idx" ON "products"("delivery_stage");
CREATE INDEX "products_delivery_work_status_idx" ON "products"("delivery_work_status");
CREATE INDEX "products_delivery_resolution_idx" ON "products"("delivery_resolution");
CREATE INDEX "products_on_hold_until_idx" ON "products"("on_hold_until");
CREATE INDEX "extensions_delivery_stage_idx" ON "extensions"("delivery_stage");
CREATE INDEX "extensions_delivery_work_status_idx" ON "extensions"("delivery_work_status");
CREATE INDEX "extensions_delivery_resolution_idx" ON "extensions"("delivery_resolution");
CREATE INDEX "extensions_on_hold_until_idx" ON "extensions"("on_hold_until");
