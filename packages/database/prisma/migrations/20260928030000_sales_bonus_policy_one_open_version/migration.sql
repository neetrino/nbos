-- At most one open Sales bonus policy version per (from_category, payment_model).
-- Complements the application FOR UPDATE lock on reactivate/publish.
-- Risk: LOW if production already has at most one open row per key; MEDIUM if
-- duplicate open windows already exist (index creation would fail until cleaned).
-- Do not run this migration against a live database from this slice.

CREATE UNIQUE INDEX "sales_bonus_policies_one_open_per_key"
ON "sales_bonus_policies" ("from_category", "payment_model")
WHERE "effective_to" IS NULL;
