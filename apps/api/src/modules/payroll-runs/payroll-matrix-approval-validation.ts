import type { PrismaClient } from '@nbos/database';

export type PayrollMatrixValidationIssue = {
  code: string;
  message: string;
  releaseId?: string;
  employeeId?: string;
  orderId?: string;
};

export async function validatePayrollMatrixForApproval(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
): Promise<PayrollMatrixValidationIssue[]> {
  const issues: PayrollMatrixValidationIssue[] = [];

  const lines = await prisma.salaryLine.findMany({
    where: { payrollRunId },
    select: {
      employeeId: true,
      bonusesTotal: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });

  for (const line of lines) {
    const releaseSum = await prisma.bonusRelease.aggregate({
      where: {
        payrollRunId,
        employeeId: line.employeeId,
        status: 'INCLUDED_IN_PAYROLL',
      },
      _sum: { payrollIncludedAmount: true, amount: true },
    });
    const included = releaseSum._sum.payrollIncludedAmount ?? releaseSum._sum.amount;
    if (included == null) continue;
    const lineBonus = line.bonusesTotal;
    if (!lineBonus.equals(included)) {
      const name = `${line.employee.firstName} ${line.employee.lastName}`.trim();
      issues.push({
        code: 'SALARY_LINE_BONUS_MISMATCH',
        message: `Salary line bonuses for ${name} do not match attached releases`,
        employeeId: line.employeeId,
      });
    }
  }

  return issues;
}
