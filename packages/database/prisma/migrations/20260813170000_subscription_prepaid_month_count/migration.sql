-- Prepaid coverage length (months) for CUSTOM subscription billing frequency

ALTER TABLE "subscriptions"
  ADD COLUMN "prepaid_month_count" INTEGER;
