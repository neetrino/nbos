-- CreateEnum
CREATE TYPE "PayrollMatrixViewModeEnum" AS ENUM ('EMPLOYEE_MATRIX', 'ORDER_MATRIX');

-- AlterTable
ALTER TABLE "bonus_entries" ADD COLUMN "title" TEXT;
ALTER TABLE "bonus_entries" ADD COLUMN "original_amount" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "payroll_matrix_layout_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "view_mode" "PayrollMatrixViewModeEnum" NOT NULL,
    "row_order" JSONB NOT NULL DEFAULT '[]',
    "column_order" JSONB NOT NULL DEFAULT '[]',
    "pinned_unit_ids" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_matrix_layout_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_matrix_layout_preferences_user_id_payroll_run_id_view_mode_key" ON "payroll_matrix_layout_preferences"("user_id", "payroll_run_id", "view_mode");

-- AddForeignKey
ALTER TABLE "payroll_matrix_layout_preferences" ADD CONSTRAINT "payroll_matrix_layout_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_matrix_layout_preferences" ADD CONSTRAINT "payroll_matrix_layout_preferences_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
