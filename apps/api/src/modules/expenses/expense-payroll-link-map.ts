export type LinkedPayrollRunJson = {
  payrollRunId: string;
  payrollMonth: string;
  salaryLineId: string;
};

type SalaryLineForPayrollLink = {
  id: string;
  payrollRunId: string;
  payrollRun: { payrollMonth: string } | null;
} | null;

/**
 * Builds API `linkedPayrollRun` from a Prisma salary line + payroll run month.
 */
export function mapSalaryLineToLinkedPayrollRun(
  salaryLine: SalaryLineForPayrollLink | undefined,
): LinkedPayrollRunJson | null {
  if (!salaryLine?.payrollRun) {
    return null;
  }
  return {
    payrollRunId: salaryLine.payrollRunId,
    payrollMonth: salaryLine.payrollRun.payrollMonth,
    salaryLineId: salaryLine.id,
  };
}
