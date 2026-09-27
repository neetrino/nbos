-- Add a nullable exclusive end so Sales rates are versioned instead of overwritten.
-- Risk: LOW. Nullable column, a one-time close of already-inactive rows, plus a
-- lookup index. Do not run this migration against a live database from this slice.

ALTER TABLE "sales_bonus_policies" ADD COLUMN "effective_to" TIMESTAMP(3);

-- Legacy off switches were is_active = false with an open window. Close those
-- rows to a zero-length interval so they pay nothing and do not overlap a
-- replacement that starts on the same date.
UPDATE "sales_bonus_policies"
SET "effective_to" = "effective_from"
WHERE "is_active" = false
  AND "effective_to" IS NULL;

CREATE INDEX "sales_bonus_policies_from_category_payment_model_effective_from_idx"
ON "sales_bonus_policies" ("from_category", "payment_model", "effective_from");
