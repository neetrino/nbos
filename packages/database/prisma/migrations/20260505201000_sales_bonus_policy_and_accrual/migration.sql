CREATE TYPE "SalesBonusPaymentModelEnum" AS ENUM ('CLASSIC', 'SUBSCRIPTION_FIRST_MONTH');
CREATE TYPE "SalesBonusSlotEnum" AS ENUM ('SELLER', 'ASSISTANT');

CREATE TABLE "sales_bonus_policies" (
    "id" TEXT NOT NULL,
    "from_category" "LeadSourceEnum" NOT NULL,
    "payment_model" "SalesBonusPaymentModelEnum" NOT NULL,
    "seller_percent" DECIMAL(5,2) NOT NULL,
    "assistant_percent" DECIMAL(5,2) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_bonus_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sales_bonus_policies_from_payment_active_idx" ON "sales_bonus_policies"("from_category", "payment_model", "is_active");

ALTER TABLE "bonus_entries" ADD COLUMN "deal_id" TEXT,
ADD COLUMN "sales_bonus_slot" "SalesBonusSlotEnum",
ADD COLUMN "calculation_snapshot" JSONB;

ALTER TABLE "bonus_entries" ADD CONSTRAINT "bonus_entries_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "bonus_entries_order_sales_bonus_slot_idx" ON "bonus_entries"("order_id", "sales_bonus_slot");

INSERT INTO "sales_bonus_policies" ("id", "from_category", "payment_model", "seller_percent", "assistant_percent", "effective_from", "is_active", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, 'SALES', 'CLASSIC', 8, 2, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'SALES', 'SUBSCRIPTION_FIRST_MONTH', 80, 20, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'MARKETING', 'CLASSIC', 6, 1, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'MARKETING', 'SUBSCRIPTION_FIRST_MONTH', 60, 10, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'PARTNER', 'CLASSIC', 6, 1, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'PARTNER', 'SUBSCRIPTION_FIRST_MONTH', 60, 10, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'CLIENT', 'CLASSIC', 4, 1, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'CLIENT', 'SUBSCRIPTION_FIRST_MONTH', 40, 10, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
