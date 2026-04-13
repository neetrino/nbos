-- Part 1: Add new enum values (must be committed before use)
-- PostgreSQL requires new enum values to be committed in a separate transaction

-- Create new enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductCategoryEnum') THEN
    CREATE TYPE "ProductCategoryEnum" AS ENUM ('CODE', 'WORDPRESS', 'SHOPIFY', 'MARKETING', 'OTHER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductTypeEnum') THEN
    CREATE TYPE "ProductTypeEnum" AS ENUM (
      'BUSINESS_CARD_WEBSITE', 'COMPANY_WEBSITE', 'MOBILE_APP', 'WEB_APP',
      'CRM', 'ECOMMERCE', 'SAAS', 'LANDING', 'ERP',
      'LOGO', 'BRANDING', 'DESIGN', 'SEO', 'PPC', 'SMM', 'OTHER'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductStatusEnum') THEN
    CREATE TYPE "ProductStatusEnum" AS ENUM (
      'NEW', 'CREATING', 'DEVELOPMENT', 'QA', 'TRANSFER', 'ON_HOLD', 'DONE', 'LOST'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExtensionSizeEnum') THEN
    CREATE TYPE "ExtensionSizeEnum" AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'LARGE');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExtensionStatusEnum') THEN
    CREATE TYPE "ExtensionStatusEnum" AS ENUM (
      'NEW', 'DEVELOPMENT', 'QA', 'TRANSFER', 'DONE', 'LOST'
    );
  END IF;
END $$;

-- Add new values to DealTypeEnum
ALTER TYPE "DealTypeEnum" ADD VALUE IF NOT EXISTS 'PRODUCT';
ALTER TYPE "DealTypeEnum" ADD VALUE IF NOT EXISTS 'MAINTENANCE';
ALTER TYPE "DealTypeEnum" ADD VALUE IF NOT EXISTS 'OUTSOURCE';

-- Add new values to OrderTypeEnum
ALTER TYPE "OrderTypeEnum" ADD VALUE IF NOT EXISTS 'MAINTENANCE';
ALTER TYPE "OrderTypeEnum" ADD VALUE IF NOT EXISTS 'OUTSOURCE';
