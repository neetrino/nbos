-- Subscription months 2+ sales bonus: separate policy row + idempotency per paid invoice (NBOS § sales bonus).

ALTER TYPE "SalesBonusPaymentModelEnum" ADD VALUE 'SUBSCRIPTION_RECURRING';

ALTER TABLE "bonus_entries" ADD COLUMN "sales_accrual_invoice_id" TEXT;

CREATE INDEX "bonus_entries_order_sales_accrual_invoice_idx" ON "bonus_entries"("order_id", "sales_accrual_invoice_id");

INSERT INTO "sales_bonus_policies" ("id", "from_category", "payment_model", "seller_percent", "assistant_percent", "effective_from", "is_active", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, 'SALES', 'SUBSCRIPTION_RECURRING', 0, 0, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'MARKETING', 'SUBSCRIPTION_RECURRING', 0, 0, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'PARTNER', 'SUBSCRIPTION_RECURRING', 0, 0, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'CLIENT', 'SUBSCRIPTION_RECURRING', 0, 0, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
