-- AlterTable
ALTER TABLE "domains" ADD COLUMN "client_service_record_id" TEXT;

-- Backfill ClientServiceRecord for legacy domain rows
DO $$
DECLARE
  r RECORD;
  csr_id TEXT;
BEGIN
  FOR r IN
    SELECT *
    FROM "domains"
    WHERE "client_service_record_id" IS NULL
  LOOP
    csr_id := gen_random_uuid()::text;
    INSERT INTO "client_service_records" (
      "id",
      "project_id",
      "type",
      "name",
      "provider",
      "status",
      "billing_model",
      "pricing_model",
      "frequency",
      "our_cost",
      "client_charge",
      "start_date",
      "renewal_date",
      "created_at",
      "updated_at"
    ) VALUES (
      csr_id,
      r."project_id",
      'DOMAIN'::"ClientServiceType",
      r."domain_name",
      r."provider",
      CASE r."status"::text
        WHEN 'ACTIVE' THEN 'ACTIVE'::"ClientServiceStatus"
        WHEN 'EXPIRING_SOON' THEN 'EXPIRING_SOON'::"ClientServiceStatus"
        WHEN 'EXPIRED' THEN 'EXPIRED'::"ClientServiceStatus"
        ELSE 'CANCELLED'::"ClientServiceStatus"
      END,
      CASE
        WHEN r."client_charge" IS NOT NULL AND r."client_charge" > 0 THEN 'CLIENT_PAID'::"ClientServiceBillingModel"
        ELSE 'COMPANY_PAID'::"ClientServiceBillingModel"
      END,
      'FIXED'::"ClientServicePricingModel",
      'YEARLY'::"ExpenseFrequency",
      r."renewal_cost",
      r."client_charge",
      r."purchase_date",
      r."expiry_date",
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    UPDATE "domains"
    SET "client_service_record_id" = csr_id
    WHERE "id" = r."id";
  END LOOP;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "domains_client_service_record_id_key" ON "domains"("client_service_record_id");

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_client_service_record_id_fkey" FOREIGN KEY ("client_service_record_id") REFERENCES "client_service_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
