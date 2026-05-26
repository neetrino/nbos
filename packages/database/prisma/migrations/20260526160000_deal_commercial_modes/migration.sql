-- Deal commercial modes: wonMode + exception metadata; order payment/delivery modes.

CREATE TYPE "DealWonModeEnum" AS ENUM ('STANDARD', 'EXCEPTION_FREE', 'EXCEPTION_POSTPAID');

CREATE TYPE "OrderPaymentModeEnum" AS ENUM ('STANDARD_PREPAY', 'POSTPAID', 'FREE');

CREATE TYPE "OrderDeliveryStartModeEnum" AS ENUM ('AFTER_PAYMENT', 'EARLY_START', 'EXCEPTION_IMMEDIATE');

ALTER TYPE "OrderStatusEnum" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';

ALTER TABLE "deals"
  ADD COLUMN "won_mode" "DealWonModeEnum",
  ADD COLUMN "exception_reason" TEXT,
  ADD COLUMN "exception_approved_by_id" TEXT,
  ADD COLUMN "exception_approved_at" TIMESTAMP(3),
  ADD COLUMN "exception_payment_expected_at" TIMESTAMP(3);

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_exception_approved_by_id_fkey"
  FOREIGN KEY ("exception_approved_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD COLUMN "payment_mode" "OrderPaymentModeEnum" NOT NULL DEFAULT 'STANDARD_PREPAY',
  ADD COLUMN "delivery_start_mode" "OrderDeliveryStartModeEnum" NOT NULL DEFAULT 'AFTER_PAYMENT';
