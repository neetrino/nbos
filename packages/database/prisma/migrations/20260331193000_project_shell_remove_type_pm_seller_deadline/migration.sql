ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_seller_id_fkey";
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_pm_id_fkey";

ALTER TABLE "projects" DROP COLUMN "type";
ALTER TABLE "projects" DROP COLUMN "seller_id";
ALTER TABLE "projects" DROP COLUMN "pm_id";
ALTER TABLE "projects" DROP COLUMN "deadline";

DROP TYPE "ProjectType";
