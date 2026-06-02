-- CreateEnum
CREATE TYPE "CredentialSecretRotationSourceEnum" AS ENUM ('PLANNED', 'MANUAL', 'EMERGENCY');

-- CreateTable
CREATE TABLE "credential_secret_versions" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "rotated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotated_by_id" TEXT NOT NULL,
    "source" "CredentialSecretRotationSourceEnum" NOT NULL DEFAULT 'MANUAL',
    "reason" TEXT,

    CONSTRAINT "credential_secret_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credential_secret_versions_credential_id_field_idx" ON "credential_secret_versions"("credential_id", "field");

-- AddForeignKey
ALTER TABLE "credential_secret_versions" ADD CONSTRAINT "credential_secret_versions_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_secret_versions" ADD CONSTRAINT "credential_secret_versions_rotated_by_id_fkey" FOREIGN KEY ("rotated_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
