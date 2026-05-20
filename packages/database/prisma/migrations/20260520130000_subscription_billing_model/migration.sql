-- Subscription billing model (NBOS canon: base_monthly_amount, billing_frequency, billing_start_date).

CREATE TYPE "SubscriptionBillingFrequencyEnum" AS ENUM ('MONTHLY', 'YEARLY', 'CUSTOM');

ALTER TABLE "subscriptions" RENAME COLUMN "amount" TO "base_monthly_amount";
ALTER TABLE "subscriptions" RENAME COLUMN "start_date" TO "billing_start_date";

ALTER TABLE "subscriptions"
  ADD COLUMN "billing_frequency" "SubscriptionBillingFrequencyEnum" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN "notifications_enabled" BOOLEAN NOT NULL DEFAULT true;
