-- Frontend developer slot on products + Developer Frontend role.
ALTER TABLE "products" ADD COLUMN "frontend_developer_id" TEXT;

ALTER TABLE "products"
  ADD CONSTRAINT "products_frontend_developer_id_fkey"
  FOREIGN KEY ("frontend_developer_id") REFERENCES "employees" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "products_frontend_developer_id_idx" ON "products"("frontend_developer_id");

ALTER TYPE "ProductTeamSlotEnum" ADD VALUE IF NOT EXISTS 'DEVELOPER_FRONTEND';

UPDATE "roles" SET "name" = 'Developer Backend' WHERE "id" = 'role-developer';

INSERT INTO "roles" ("id", "name", "slug", "level", "is_system")
SELECT 'role-developer-frontend', 'Developer Frontend', 'developer-frontend', 5, true
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "id" = 'role-developer-frontend');
