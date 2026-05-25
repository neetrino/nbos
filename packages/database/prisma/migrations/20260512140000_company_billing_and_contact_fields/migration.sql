-- Company: billing contact + communication / locale fields (NBOS Clients canon)
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "billing_contact_id" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "country" TEXT;

CREATE INDEX IF NOT EXISTS "companies_billing_contact_id_idx" ON "companies"("billing_contact_id");

DO $$
BEGIN
  ALTER TABLE "companies"
    ADD CONSTRAINT "companies_billing_contact_id_fkey"
    FOREIGN KEY ("billing_contact_id") REFERENCES "contacts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
