-- Partner lifecycle: ACTIVE | PAUSED | TERMINATED (replaces INACTIVE → TERMINATED)
CREATE TYPE "PartnerStatusEnum_new" AS ENUM ('ACTIVE', 'PAUSED', 'TERMINATED');

ALTER TABLE "partners" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "partners"
  ALTER COLUMN "status" TYPE "PartnerStatusEnum_new"
  USING (
    CASE
      WHEN ("status")::text = 'INACTIVE' THEN 'TERMINATED'::"PartnerStatusEnum_new"
      ELSE ("status")::text::"PartnerStatusEnum_new"
    END
  );

DROP TYPE "PartnerStatusEnum";
ALTER TYPE "PartnerStatusEnum_new" RENAME TO "PartnerStatusEnum";

ALTER TABLE "partners" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"PartnerStatusEnum";

-- Agreement metadata + Drive file link (NBOS § Partner Analytics and Agreements)
CREATE TYPE "PartnerAgreementStatusEnum" AS ENUM ('NO_AGREEMENT', 'DRAFT', 'ACTIVE', 'EXPIRED');

ALTER TABLE "partners" ADD COLUMN "notes" TEXT;
ALTER TABLE "partners" ADD COLUMN "start_date" TIMESTAMP(3);
ALTER TABLE "partners" ADD COLUMN "agreement_status" "PartnerAgreementStatusEnum" NOT NULL DEFAULT 'NO_AGREEMENT';
ALTER TABLE "partners" ADD COLUMN "agreement_start_date" TIMESTAMP(3);
ALTER TABLE "partners" ADD COLUMN "agreement_end_date" TIMESTAMP(3);
ALTER TABLE "partners" ADD COLUMN "agreement_special_terms" TEXT;
ALTER TABLE "partners" ADD COLUMN "agreement_file_asset_id" TEXT;
ALTER TABLE "partners" ADD COLUMN "agreement_owner_id" TEXT;

ALTER TABLE "partners"
  ADD CONSTRAINT "partners_agreement_file_asset_id_fkey"
  FOREIGN KEY ("agreement_file_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partners"
  ADD CONSTRAINT "partners_agreement_owner_id_fkey"
  FOREIGN KEY ("agreement_owner_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "partners_agreement_file_asset_id_idx" ON "partners"("agreement_file_asset_id");
CREATE INDEX "partners_agreement_owner_id_idx" ON "partners"("agreement_owner_id");
