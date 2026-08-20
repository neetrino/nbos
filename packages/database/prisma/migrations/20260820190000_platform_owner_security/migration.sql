-- Platform Owner identity (not an RBAC role), credential confidentiality,
-- emergency access requests, and lock the legacy owner role.

ALTER TABLE "roles" ADD COLUMN "assignable" BOOLEAN NOT NULL DEFAULT true;

UPDATE "roles"
SET "assignable" = false
WHERE "slug" = 'owner' OR "id" = 'role-owner';

CREATE TYPE "CredentialConfidentialityEnum" AS ENUM ('NORMAL', 'RESTRICTED', 'OWNER_ONLY');

ALTER TABLE "credentials"
ADD COLUMN "confidentiality" "CredentialConfidentialityEnum" NOT NULL DEFAULT 'NORMAL';

CREATE INDEX "credentials_confidentiality_idx" ON "credentials"("confidentiality");

CREATE TABLE "platform_ownership" (
    "id" TEXT NOT NULL,
    "owner_employee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferred_at" TIMESTAMP(3),
    "transferred_by_employee_id" TEXT,

    CONSTRAINT "platform_ownership_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "platform_ownership"
ADD CONSTRAINT "platform_ownership_owner_employee_id_fkey"
FOREIGN KEY ("owner_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "platform_ownership"
ADD CONSTRAINT "platform_ownership_transferred_by_employee_id_fkey"
FOREIGN KEY ("transferred_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "CredentialEmergencyRequestStatusEnum" AS ENUM (
  'PENDING',
  'APPROVED',
  'DENIED',
  'EXPIRED',
  'CANCELLED'
);

CREATE TABLE "credential_emergency_access_requests" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "ttl_ms" INTEGER NOT NULL,
    "status" "CredentialEmergencyRequestStatusEnum" NOT NULL DEFAULT 'PENDING',
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "grant_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_emergency_access_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "credential_emergency_access_requests_status_created_at_idx"
  ON "credential_emergency_access_requests"("status", "created_at");
CREATE INDEX "credential_emergency_access_requests_credential_id_idx"
  ON "credential_emergency_access_requests"("credential_id");
CREATE INDEX "credential_emergency_access_requests_requester_id_idx"
  ON "credential_emergency_access_requests"("requester_id");

ALTER TABLE "credential_emergency_access_requests"
ADD CONSTRAINT "credential_emergency_access_requests_credential_id_fkey"
FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credential_emergency_access_requests"
ADD CONSTRAINT "credential_emergency_access_requests_requester_id_fkey"
FOREIGN KEY ("requester_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credential_emergency_access_requests"
ADD CONSTRAINT "credential_emergency_access_requests_decided_by_id_fkey"
FOREIGN KEY ("decided_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DELETE FROM "role_permissions" rp
USING "permissions" p
WHERE rp."permission_id" = p."id"
  AND p."module" = 'CREDENTIALS'
  AND p."action" = 'BYPASS_ROW_VISIBILITY';

DELETE FROM "permissions"
WHERE "module" = 'CREDENTIALS'
  AND "action" = 'BYPASS_ROW_VISIBILITY';

UPDATE "role_access_policies"
SET "scope_mode" = 'ASSIGNED'
WHERE "resource_family" = 'CREDENTIALS'
  AND "scope_mode" = 'ALL';

UPDATE "employee_access_overrides"
SET "scope_mode" = 'ASSIGNED'
WHERE "resource_family" = 'CREDENTIALS'
  AND "scope_mode" = 'ALL';
