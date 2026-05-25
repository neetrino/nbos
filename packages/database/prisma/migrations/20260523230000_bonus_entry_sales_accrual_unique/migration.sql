-- Idempotent SALES accrual: one row per slotted role per order; one row per employee per invoice (recurring).
CREATE UNIQUE INDEX "bonus_entries_sales_slotted_unique"
ON "bonus_entries" ("order_id", "sales_bonus_slot")
WHERE "type" = 'SALES' AND "sales_bonus_slot" IS NOT NULL;

CREATE UNIQUE INDEX "bonus_entries_sales_invoice_employee_unique"
ON "bonus_entries" ("order_id", "sales_accrual_invoice_id", "employee_id")
WHERE "type" = 'SALES' AND "sales_accrual_invoice_id" IS NOT NULL;
