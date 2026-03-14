-- Extend ProductTypeEnum with deal-related values
ALTER TYPE "ProductTypeEnum" ADD VALUE 'WEB_APP';
ALTER TYPE "ProductTypeEnum" ADD VALUE 'ECOMMERCE';
ALTER TYPE "ProductTypeEnum" ADD VALUE 'SAAS';
ALTER TYPE "ProductTypeEnum" ADD VALUE 'LANDING';
ALTER TYPE "ProductTypeEnum" ADD VALUE 'ERP';

-- AlterTable
ALTER TABLE "deals" ADD COLUMN "product_type" "ProductTypeEnum" NULL;
