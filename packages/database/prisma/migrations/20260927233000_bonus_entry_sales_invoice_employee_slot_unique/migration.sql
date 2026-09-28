-- Replace invoice+employee uniqueness so one employee can hold both Sales slots
-- on the same qualifying invoice. Replay of a slot stays one row.
-- Recurring (unslotted) rows keep invoice+employee uniqueness separately:
-- PostgreSQL unique indexes treat NULL slot values as distinct, so the old
-- three-column key cannot move onto sales_bonus_slot without a NULL-slot index.
-- Risk: MEDIUM. Unique index replacement. Existing rows cannot violate the new
-- keys: the previous index was stricter (no slot) and blocked dual-role pairs.
-- Do not run this migration against a live database from this slice.

DROP INDEX IF EXISTS "bonus_entries_sales_invoice_employee_unique";

CREATE UNIQUE INDEX "bonus_entries_sales_invoice_employee_slot_unique"
ON "bonus_entries" ("order_id", "sales_accrual_invoice_id", "employee_id", "sales_bonus_slot")
WHERE "type" = 'SALES'
  AND "sales_accrual_invoice_id" IS NOT NULL
  AND "sales_bonus_slot" IS NOT NULL;

CREATE UNIQUE INDEX "bonus_entries_sales_invoice_employee_unslotted_unique"
ON "bonus_entries" ("order_id", "sales_accrual_invoice_id", "employee_id")
WHERE "type" = 'SALES'
  AND "sales_accrual_invoice_id" IS NOT NULL
  AND "sales_bonus_slot" IS NULL;
