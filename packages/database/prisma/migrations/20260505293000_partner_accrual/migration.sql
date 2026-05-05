-- CreateEnum
CREATE TYPE "PartnerAccrualStatusEnum" AS ENUM ('ACCRUED', 'ELIGIBLE', 'IN_BATCH', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "partner_accruals" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "referral_terms_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "product_id" TEXT,
    "order_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "invoice_id" TEXT,
    "payment_id" TEXT NOT NULL,
    "deal_type" "DealTypeEnum" NOT NULL,
    "payment_type" "PaymentTypeEnum" NOT NULL,
    "base_amount" DECIMAL(14,2) NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "PartnerAccrualStatusEnum" NOT NULL DEFAULT 'ELIGIBLE',
    "eligible_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_accruals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_accruals_payment_id_key" ON "partner_accruals"("payment_id");

-- CreateIndex
CREATE INDEX "partner_accruals_partner_id_idx" ON "partner_accruals"("partner_id");

-- CreateIndex
CREATE INDEX "partner_accruals_order_id_idx" ON "partner_accruals"("order_id");

-- CreateIndex
CREATE INDEX "partner_accruals_project_id_idx" ON "partner_accruals"("project_id");

-- AddForeignKey
ALTER TABLE "partner_accruals" ADD CONSTRAINT "partner_accruals_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accruals" ADD CONSTRAINT "partner_accruals_referral_terms_id_fkey" FOREIGN KEY ("referral_terms_id") REFERENCES "partner_referral_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accruals" ADD CONSTRAINT "partner_accruals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accruals" ADD CONSTRAINT "partner_accruals_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accruals" ADD CONSTRAINT "partner_accruals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accruals" ADD CONSTRAINT "partner_accruals_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accruals" ADD CONSTRAINT "partner_accruals_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accruals" ADD CONSTRAINT "partner_accruals_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
