-- CreateTable
CREATE TABLE "expense_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExpenseCategoryEnum" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "ExpenseFrequency" NOT NULL DEFAULT 'ONE_TIME',
    "next_due_date" TIMESTAMP(3),
    "provider" TEXT,
    "project_id" TEXT,
    "auto_generate" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expense_plans_project_id_idx" ON "expense_plans"("project_id");

ALTER TABLE "expense_plans" ADD CONSTRAINT "expense_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD COLUMN "expense_plan_id" TEXT;

CREATE INDEX "expenses_expense_plan_id_idx" ON "expenses"("expense_plan_id");

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expense_plan_id_fkey" FOREIGN KEY ("expense_plan_id") REFERENCES "expense_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
