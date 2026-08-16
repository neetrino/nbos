-- Agreed subscription term length in covered months (Deal → Order history → Subscription).
-- Nullable: null means open-ended / not set. No backfill.

ALTER TABLE "deals"
  ADD COLUMN "subscription_term_months" INTEGER;

ALTER TABLE "orders"
  ADD COLUMN "subscription_term_months" INTEGER;

ALTER TABLE "subscriptions"
  ADD COLUMN "term_months" INTEGER;
