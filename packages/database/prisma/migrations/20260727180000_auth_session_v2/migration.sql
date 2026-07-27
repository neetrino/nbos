-- AuthSession V2: server-side refresh sessions + employee authVersion

CREATE TYPE "AuthSessionStatus" AS ENUM (
  'ACTIVE',
  'ROTATED',
  'REVOKED',
  'EXPIRED',
  'COMPROMISED'
);

ALTER TABLE "employees" ADD COLUMN "auth_version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "token_family_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "previous_refresh_hash" TEXT,
    "previous_hash_expires_at" TIMESTAMP(3),
    "status" "AuthSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "rotated_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "created_ip_hash" TEXT,
    "last_ip_hash" TEXT,
    "user_agent_hash" TEXT,
    "device_label" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_sessions_employee_id_status_idx" ON "auth_sessions"("employee_id", "status");
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");
CREATE INDEX "auth_sessions_token_family_id_idx" ON "auth_sessions"("token_family_id");

ALTER TABLE "auth_sessions"
  ADD CONSTRAINT "auth_sessions_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
