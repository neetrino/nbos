-- AlterTable
ALTER TABLE "deals" ADD COLUMN "company_id" TEXT,
ADD COLUMN "tax_status" "TaxStatus" NOT NULL DEFAULT 'TAX';

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
