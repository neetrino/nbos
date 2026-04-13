-- Move existing FROZEN leads to NEW before removing the enum value
UPDATE "leads" SET "status" = 'NEW' WHERE "status" = 'FROZEN';

-- Remove FROZEN from LeadStatusEnum
ALTER TYPE "LeadStatusEnum" RENAME TO "LeadStatusEnum_old";
CREATE TYPE "LeadStatusEnum" AS ENUM ('NEW', 'DIDNT_GET_THROUGH', 'CONTACT_ESTABLISHED', 'MQL', 'SPAM', 'SQL');
ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "status" TYPE "LeadStatusEnum" USING ("status"::text::"LeadStatusEnum");
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'NEW';
DROP TYPE "LeadStatusEnum_old";
