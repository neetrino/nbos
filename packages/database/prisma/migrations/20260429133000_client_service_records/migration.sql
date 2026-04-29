-- CreateEnum
CREATE TYPE "ClientServiceType" AS ENUM ('DOMAIN', 'HOSTING', 'SERVICE', 'ACCOUNT', 'LICENSE');

-- CreateEnum
CREATE TYPE "ClientServiceStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClientServiceBillingModel" AS ENUM ('CLIENT_PAID', 'COMPANY_PAID');

-- CreateEnum
CREATE TYPE "ClientServicePricingModel" AS ENUM ('FIXED', 'USAGE_BASED');

-- CreateTable
CREATE TABLE "client_service_records" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "product_id" TEXT,
    "type" "ClientServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "provider_account_id" TEXT,
    "status" "ClientServiceStatus" NOT NULL DEFAULT 'PENDING',
    "billing_model" "ClientServiceBillingModel" NOT NULL DEFAULT 'CLIENT_PAID',
    "pricing_model" "ClientServicePricingModel" NOT NULL DEFAULT 'FIXED',
    "frequency" "ExpenseFrequency" NOT NULL DEFAULT 'YEARLY',
    "our_cost" DECIMAL(12,2),
    "client_charge" DECIMAL(12,2),
    "tax_status" "TaxStatus" NOT NULL DEFAULT 'TAX',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_service_records_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "client_service_record_id" TEXT;
ALTER TABLE "expense_plans" ADD COLUMN "client_service_record_id" TEXT;
ALTER TABLE "expenses" ADD COLUMN "client_service_record_id" TEXT;

-- CreateIndex
CREATE INDEX "client_service_records_project_id_idx" ON "client_service_records"("project_id");
CREATE INDEX "client_service_records_product_id_idx" ON "client_service_records"("product_id");
CREATE INDEX "client_service_records_provider_account_id_idx" ON "client_service_records"("provider_account_id");
CREATE INDEX "client_service_records_type_idx" ON "client_service_records"("type");
CREATE INDEX "client_service_records_status_idx" ON "client_service_records"("status");
CREATE INDEX "client_service_records_billing_model_idx" ON "client_service_records"("billing_model");
CREATE INDEX "client_service_records_renewal_date_idx" ON "client_service_records"("renewal_date");
CREATE INDEX "invoices_client_service_record_id_idx" ON "invoices"("client_service_record_id");
CREATE INDEX "expense_plans_client_service_record_id_idx" ON "expense_plans"("client_service_record_id");
CREATE INDEX "expenses_client_service_record_id_idx" ON "expenses"("client_service_record_id");

-- AddForeignKey
ALTER TABLE "client_service_records" ADD CONSTRAINT "client_service_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_service_records" ADD CONSTRAINT "client_service_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_service_records" ADD CONSTRAINT "client_service_records_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_service_record_id_fkey" FOREIGN KEY ("client_service_record_id") REFERENCES "client_service_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense_plans" ADD CONSTRAINT "expense_plans_client_service_record_id_fkey" FOREIGN KEY ("client_service_record_id") REFERENCES "client_service_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_client_service_record_id_fkey" FOREIGN KEY ("client_service_record_id") REFERENCES "client_service_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
