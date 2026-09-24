-- Nullable permanent owner on Contact and Company. No backfill.

ALTER TABLE "contacts" ADD COLUMN "responsible_employee_id" TEXT;
ALTER TABLE "companies" ADD COLUMN "responsible_employee_id" TEXT;

CREATE INDEX "contacts_responsible_employee_id_idx" ON "contacts"("responsible_employee_id");
CREATE INDEX "companies_responsible_employee_id_idx" ON "companies"("responsible_employee_id");

ALTER TABLE "contacts" ADD CONSTRAINT "contacts_responsible_employee_id_fkey" FOREIGN KEY ("responsible_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "companies" ADD CONSTRAINT "companies_responsible_employee_id_fkey" FOREIGN KEY ("responsible_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
