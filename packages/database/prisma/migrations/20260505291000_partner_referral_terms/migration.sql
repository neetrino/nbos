-- CreateEnum
CREATE TYPE "PartnerReferralSourcePolicyEnum" AS ENUM ('POLICY', 'DEFAULT', 'OVERRIDE');

-- CreateTable
CREATE TABLE "partner_referral_terms" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "deal_type" "DealTypeEnum" NOT NULL,
    "payment_type" "PaymentTypeEnum",
    "partner_percent" DECIMAL(5,2) NOT NULL,
    "source_policy" "PartnerReferralSourcePolicyEnum" NOT NULL,
    "override_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_referral_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_referral_terms_deal_id_key" ON "partner_referral_terms"("deal_id");

-- CreateIndex
CREATE INDEX "partner_referral_terms_partner_id_idx" ON "partner_referral_terms"("partner_id");

-- AddForeignKey
ALTER TABLE "partner_referral_terms" ADD CONSTRAINT "partner_referral_terms_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_referral_terms" ADD CONSTRAINT "partner_referral_terms_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
