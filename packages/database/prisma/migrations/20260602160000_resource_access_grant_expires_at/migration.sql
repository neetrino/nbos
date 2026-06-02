-- Temporary manual/platform grants: optional expiry (credentials Slice C).
ALTER TABLE "resource_access_grants" ADD COLUMN "expires_at" TIMESTAMP(3);

CREATE INDEX "resource_access_grants_expires_at_idx" ON "resource_access_grants"("expires_at");
