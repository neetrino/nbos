-- Recurring (unslotted) uniqueness must allow one employee to hold both
-- Sales roles on the same invoice without using sales_bonus_slot (the
-- order+slot unique would block the next subscription month).
-- Discriminator is sales_accrual_role (SELLER | ASSISTANT), not percent.
-- Slotted first-month rows keep sales_accrual_role NULL and stay out of
-- this index via sales_bonus_slot IS NULL.
-- Risk: MEDIUM. Nullable column (LOW) plus unique index replacement.
-- Existing unslotted rows have no role yet and stay outside the new
-- partial unique until the application writes the column.
-- Do not drop bonus_entries_sales_slotted_unique or
-- bonus_entries_sales_invoice_employee_slot_unique.
-- Do not run this migration against a live database from this slice.

ALTER TABLE "bonus_entries"
ADD COLUMN "sales_accrual_role" "SalesBonusSlotEnum";

DROP INDEX IF EXISTS "bonus_entries_sales_invoice_employee_unslotted_unique";

CREATE UNIQUE INDEX "bonus_entries_sales_invoice_employee_unslotted_unique"
ON "bonus_entries" ("order_id", "sales_accrual_invoice_id", "employee_id", "sales_accrual_role")
WHERE "type" = 'SALES'
  AND "sales_accrual_invoice_id" IS NOT NULL
  AND "sales_bonus_slot" IS NULL
  AND "sales_accrual_role" IS NOT NULL;
