-- CreateEnum
CREATE TYPE "FinancePostingPeriodStatusEnum" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "JournalRecognitionBasisEnum" AS ENUM ('ACCRUAL', 'CASH');

-- CreateEnum
CREATE TYPE "JournalSourceTypeEnum" AS ENUM (
  'PAYMENT',
  'EXPENSE_PAYMENT',
  'INVOICE_CARD',
  'EXPENSE_CARD',
  'PAYROLL_RUN',
  'SALARY_LINE',
  'MANUAL_ADJUSTMENT'
);

-- CreateEnum
CREATE TYPE "JournalLineStatusEnum" AS ENUM ('ACTIVE', 'REVERSED');

-- CreateTable
CREATE TABLE "finance_posting_periods" (
  "id" TEXT NOT NULL,
  "month_key" VARCHAR(7) NOT NULL,
  "status" "FinancePostingPeriodStatusEnum" NOT NULL DEFAULT 'OPEN',
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "closed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "finance_posting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_journal_entries" (
  "id" TEXT NOT NULL,
  "amount" DECIMAL(14, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AMD',
  "fx_rate_applied" DECIMAL(18, 8) NOT NULL DEFAULT 1,
  "functional_amount" DECIMAL(14, 2) NOT NULL,
  "booked_at" TIMESTAMP(3) NOT NULL,
  "recognition_basis" "JournalRecognitionBasisEnum" NOT NULL,
  "posting_period_id" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "source_type" "JournalSourceTypeEnum" NOT NULL,
  "source_id" TEXT NOT NULL,
  "description" TEXT,
  "status" "JournalLineStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  "company_id" TEXT,
  "project_id" TEXT,
  "product_id" TEXT,
  "order_id" TEXT,
  "employee_id" TEXT,
  "department_id" TEXT,
  "partner_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "operational_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_posting_periods_month_key_key" ON "finance_posting_periods"("month_key");

-- CreateIndex
CREATE UNIQUE INDEX "operational_journal_entries_idempotency_key_key" ON "operational_journal_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "operational_journal_entries_posting_period_id_idx" ON "operational_journal_entries"("posting_period_id");

-- CreateIndex
CREATE INDEX "operational_journal_entries_booked_at_idx" ON "operational_journal_entries"("booked_at");

-- CreateIndex
CREATE INDEX "operational_journal_entries_source_type_source_id_idx" ON "operational_journal_entries"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "operational_journal_entries_company_id_idx" ON "operational_journal_entries"("company_id");

-- CreateIndex
CREATE INDEX "operational_journal_entries_project_id_idx" ON "operational_journal_entries"("project_id");

-- CreateIndex
CREATE INDEX "operational_journal_entries_order_id_idx" ON "operational_journal_entries"("order_id");

-- AddForeignKey
ALTER TABLE "operational_journal_entries" ADD CONSTRAINT "operational_journal_entries_posting_period_id_fkey" FOREIGN KEY ("posting_period_id") REFERENCES "finance_posting_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_journal_entries" ADD CONSTRAINT "operational_journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_journal_entries" ADD CONSTRAINT "operational_journal_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_journal_entries" ADD CONSTRAINT "operational_journal_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_journal_entries" ADD CONSTRAINT "operational_journal_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_journal_entries" ADD CONSTRAINT "operational_journal_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_journal_entries" ADD CONSTRAINT "operational_journal_entries_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_journal_entries" ADD CONSTRAINT "operational_journal_entries_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
