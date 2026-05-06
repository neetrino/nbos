-- Partner commission policy: one row per partner + deal type (NBOS § Partner Commission Policy).

CREATE TABLE "partner_commission_policy_rows" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "deal_type" "DealTypeEnum" NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_commission_policy_rows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_commission_policy_rows_partner_id_deal_type_key" ON "partner_commission_policy_rows"("partner_id", "deal_type");

CREATE INDEX "partner_commission_policy_rows_partner_id_idx" ON "partner_commission_policy_rows"("partner_id");

ALTER TABLE "partner_commission_policy_rows" ADD CONSTRAINT "partner_commission_policy_rows_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
