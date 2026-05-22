import { NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient, type PayrollRunStatusEnum } from '@nbos/database';
import type {
  PayrollRunBonusReleaseRowDto,
  PayrollRunBonusReleasesDto,
} from './payroll-run-bonus-releases.types';

const ATTACH_ALLOWED: PayrollRunStatusEnum[] = ['DRAFT', 'REVIEW'];

type ReleaseDb = {
  id: string;
  bonusEntryId: string;
  employeeId: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
  releaseType: string;
  status: string;
  bonusEntry: {
    type: string;
    order: { code: string };
  };
  employee: { firstName: string; lastName: string };
  project: { code: string; name: string };
  product: { name: string } | null;
  extension: { name: string } | null;
};

function productLabel(release: ReleaseDb): string {
  if (release.product?.name) return release.product.name;
  if (release.extension?.name) return release.extension.name;
  return `Order ${release.bonusEntry.order.code}`;
}

function mapRow(release: ReleaseDb): PayrollRunBonusReleaseRowDto {
  const employeeName = `${release.employee.firstName} ${release.employee.lastName}`.trim();
  return {
    id: release.id,
    bonusEntryId: release.bonusEntryId,
    employeeId: release.employeeId,
    employeeName,
    projectCode: release.project.code,
    projectName: release.project.name,
    orderCode: release.bonusEntry.order.code,
    productLabel: productLabel(release),
    bonusType: release.bonusEntry.type,
    releaseType: release.releaseType,
    status: release.status,
    amount: release.amount.toFixed(2),
    payrollIncludedAmount: release.payrollIncludedAmount?.toFixed(2) ?? null,
  };
}

const releaseInclude = {
  bonusEntry: { include: { order: { select: { code: true } } } },
  employee: { select: { firstName: true, lastName: true } },
  project: { select: { code: true, name: true } },
  product: { select: { name: true } },
  extension: { select: { name: true } },
} as const;

/** Included and attachable bonus releases for payroll run workspace (NBOS Phase 4). */
export async function queryPayrollRunBonusReleases(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
): Promise<PayrollRunBonusReleasesDto> {
  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: { id: true, payrollMonth: true, status: true },
  });
  if (!run) {
    throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
  }

  const lineEmployeeIds = (
    await prisma.salaryLine.findMany({
      where: { payrollRunId },
      select: { employeeId: true },
    })
  ).map((l) => l.employeeId);

  const [includedRows, availableRows] = await Promise.all([
    prisma.bonusRelease.findMany({
      where: { payrollRunId, status: 'INCLUDED_IN_PAYROLL' },
      orderBy: [{ employee: { lastName: 'asc' } }, { createdAt: 'asc' }],
      include: releaseInclude,
    }),
    ATTACH_ALLOWED.includes(run.status) && lineEmployeeIds.length > 0
      ? prisma.bonusRelease.findMany({
          where: {
            status: 'APPROVED',
            employeeId: { in: lineEmployeeIds },
            OR: [{ payrollRunId: null }, { payrollRunId }],
          },
          orderBy: [{ employee: { lastName: 'asc' } }, { createdAt: 'asc' }],
          include: releaseInclude,
        })
      : Promise.resolve([]),
  ]);

  return {
    payrollRunId: run.id,
    payrollMonth: run.payrollMonth,
    runStatus: run.status,
    canAttach: ATTACH_ALLOWED.includes(run.status),
    included: includedRows.map(mapRow),
    availableToAttach: availableRows.map(mapRow),
  };
}
