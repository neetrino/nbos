-- CreateEnum
CREATE TYPE "ProductCategoryEnum" AS ENUM ('CODE', 'WORDPRESS', 'SHOPIFY', 'MARKETING', 'OTHER');

-- AlterEnum: ProductTypeEnum — add new values
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'BUSINESS_CARD_WEBSITE';
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'COMPANY_WEBSITE';
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'BRANDING';
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'DESIGN';
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'PPC';

-- AlterTable: Deal — add product_category
ALTER TABLE "deals" ADD COLUMN "product_category" "ProductCategoryEnum";

-- AlterTable: Product — add product_category (nullable first for existing rows)
ALTER TABLE "products" ADD COLUMN "product_category" "ProductCategoryEnum";

-- Backfill existing products based on product_type
UPDATE "products" SET "product_category" = 'CODE'
WHERE "product_type" IN ('COMPANY_WEBSITE', 'BUSINESS_CARD_WEBSITE', 'MOBILE_APP', 'WEB_APP', 'CRM', 'ECOMMERCE', 'SAAS', 'LANDING', 'ERP');

UPDATE "products" SET "product_category" = 'MARKETING'
WHERE "product_type" IN ('LOGO', 'BRANDING', 'DESIGN', 'SEO', 'PPC', 'SMM');

UPDATE "products" SET "product_category" = 'OTHER'
WHERE "product_category" IS NULL;

-- Now make product_category NOT NULL on products
ALTER TABLE "products" ALTER COLUMN "product_category" SET NOT NULL;
