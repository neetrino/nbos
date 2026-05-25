-- Explicit per-employee grants on FileAsset (Drive sharing / Shared with me).

CREATE TABLE "file_asset_grants" (
    "id" TEXT NOT NULL,
    "file_asset_id" TEXT NOT NULL,
    "grantee_employee_id" TEXT NOT NULL,
    "granted_by_id" TEXT,
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_asset_grants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "file_asset_grants_file_asset_id_idx" ON "file_asset_grants"("file_asset_id");
CREATE INDEX "file_asset_grants_grantee_revoked_idx" ON "file_asset_grants"("grantee_employee_id", "revoked_at");

ALTER TABLE "file_asset_grants"
ADD CONSTRAINT "file_asset_grants_file_asset_id_fkey"
FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "file_asset_grants"
ADD CONSTRAINT "file_asset_grants_grantee_employee_id_fkey"
FOREIGN KEY ("grantee_employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "file_asset_grants"
ADD CONSTRAINT "file_asset_grants_granted_by_id_fkey"
FOREIGN KEY ("granted_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
