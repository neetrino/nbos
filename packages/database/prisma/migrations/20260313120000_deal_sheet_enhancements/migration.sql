-- PaymentTypeEnum already migrated to CLASSIC/SUBSCRIPTION in prior partial run
-- LeadSourceEnum already migrated to MARKETING/SALES/PARTNER/CLIENT in prior partial run

-- 3. Add marketing fields to leads and deals (IF NOT EXISTS for idempotency)
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_detail" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_partner_id" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_contact_id" TEXT;

ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "source_detail" TEXT;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "source_partner_id" TEXT;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "source_contact_id" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_source_partner_id_fkey') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_source_partner_id_fkey" FOREIGN KEY ("source_partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_source_contact_id_fkey') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_source_contact_id_fkey" FOREIGN KEY ("source_contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_source_partner_id_fkey') THEN
    ALTER TABLE "deals" ADD CONSTRAINT "deals_source_partner_id_fkey" FOREIGN KEY ("source_partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_source_contact_id_fkey') THEN
    ALTER TABLE "deals" ADD CONSTRAINT "deals_source_contact_id_fkey" FOREIGN KEY ("source_contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. InvoiceStatusEnum: replace with new stages (idempotent check)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NEW' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'InvoiceStatusEnum')) THEN
    ALTER TABLE "invoices" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "invoices" ALTER COLUMN "status" TYPE text;

    UPDATE "invoices" SET "status" = 'THIS_MONTH' WHERE "status" = 'NEW';
    UPDATE "invoices" SET "status" = 'CREATE_INVOICE' WHERE "status" = 'CREATED_IN_GOV';
    UPDATE "invoices" SET "status" = 'WAITING' WHERE "status" = 'SENT';
    UPDATE "invoices" SET "status" = 'DELAYED' WHERE "status" = 'OVERDUE';
    UPDATE "invoices" SET "status" = 'FAIL' WHERE "status" = 'UNPAID';

    DROP TYPE "InvoiceStatusEnum";
    CREATE TYPE "InvoiceStatusEnum" AS ENUM ('THIS_MONTH', 'CREATE_INVOICE', 'WAITING', 'DELAYED', 'ON_HOLD', 'FAIL', 'PAID');

    ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatusEnum" USING ("status"::"InvoiceStatusEnum");
    ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'THIS_MONTH';
  END IF;
END $$;
