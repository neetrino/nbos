import type { PrismaClient } from '@nbos/database';

const REASON_REQUIRED_TYPES = ['EXTRA', 'OVER_FUNDING', 'EARLY'] as const;

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

  const includedReleases = await prisma.bonusRelease.findMany({
    where: { payrollRunId, status: 'INCLUDED_IN_PAYROLL' },
    select: {
      id: true,
      employeeId: true,
      releaseType: true,
      reason: true,
      approvedById: true,
      bonusEntry: { select: { orderId: true } },
    },
  });

  for (const release of includedReleases) {
    const orderId = release.bonusEntry.orderId;
    if (
      REASON_REQUIRED_TYPES.includes(
        release.releaseType as (typeof REASON_REQUIRED_TYPES)[number],
      ) &&
      !(release.reason?.trim().length ?? 0)
    ) {
      issues.push({
        code: 'RELEASE_REASON_REQUIRED',
        message: `${release.releaseType} release requires a reason before approval`,
        releaseId: release.id,
        employeeId: release.employeeId,
        orderId,
      });
    }
    if (release.releaseType === 'OVER_FUNDING' && !release.approvedById) {
      issues.push({
        code: 'OVER_FUNDING_APPROVAL_REQUIRED',
        message: 'Over funding release requires approver before payroll approval',
        releaseId: release.id,
        employeeId: release.employeeId,
        orderId,
      });
    }
  }

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
