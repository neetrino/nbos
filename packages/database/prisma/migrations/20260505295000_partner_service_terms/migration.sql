CREATE TYPE "PartnerServiceTypeEnum" AS ENUM ('SEO', 'SMM', 'ADS', 'OTHER');

CREATE TYPE "PartnerServicePaymentModelEnum" AS ENUM ('ONE_TIME', 'MONTHLY', 'CUSTOM');

CREATE TYPE "PartnerServiceStatusEnum" AS ENUM (
  'PENDING',
  'ACTIVE',
  'ON_HOLD',
  'CANCELLED',
  'COMPLETED'
);

CREATE TABLE "partner_service_terms" (
  "id" TEXT NOT NULL,
  "partner_id" TEXT NOT NULL,
  "client_contact_id" TEXT,
  "client_company_id" TEXT,
  "project_id" TEXT,
  "service_type" "PartnerServiceTypeEnum" NOT NULL,
  "payment_model" "PartnerServicePaymentModelEnum" NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "billing_start_date" TIMESTAMP(3),
  "subscription_id" TEXT,
  "invoice_id" TEXT,
  "status" "PartnerServiceStatusEnum" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "partner_service_terms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "partner_service_terms_partner_id_idx" ON "partner_service_terms"("partner_id");
CREATE INDEX "partner_service_terms_status_idx" ON "partner_service_terms"("status");
CREATE INDEX "partner_service_terms_project_id_idx" ON "partner_service_terms"("project_id");

ALTER TABLE "partner_service_terms"
ADD CONSTRAINT "partner_service_terms_partner_id_fkey"
FOREIGN KEY ("partner_id") REFERENCES "partners"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "partner_service_terms"
ADD CONSTRAINT "partner_service_terms_client_contact_id_fkey"
FOREIGN KEY ("client_contact_id") REFERENCES "contacts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partner_service_terms"
ADD CONSTRAINT "partner_service_terms_client_company_id_fkey"
FOREIGN KEY ("client_company_id") REFERENCES "companies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partner_service_terms"
ADD CONSTRAINT "partner_service_terms_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partner_service_terms"
ADD CONSTRAINT "partner_service_terms_subscription_id_fkey"
FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partner_service_terms"
ADD CONSTRAINT "partner_service_terms_invoice_id_fkey"
FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
