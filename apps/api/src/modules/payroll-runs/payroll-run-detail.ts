import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { AccessibleEmployeeIds } from '../compensation-profiles/finance-pay-access';
import { employeeIdWhere } from '../compensation-profiles/finance-pay-access';
import { PAYROLL_RUN_AUDIT_ENTITY_TYPE } from './payroll-run-audit.constants';
import { loadPayrollRunAuditTrail } from './payroll-run-audit-trail';
import { buildPayrollRunJournal } from './payroll-run-journal';
import { fetchMaterializedSalaryLineCountByPayrollRunId } from './payroll-run-materialized-line-counts';
import { omitLegacyPayrollKpiFields } from './payroll-run-api-response';
import { filterSalaryLinesByAccess, overlayPayrollRunDetailTotals } from './payroll-run-access';

export async function loadPayrollRunDetail(
  prisma: InstanceType<typeof PrismaClient>,
  id: string,
  accessible: AccessibleEmployeeIds,
) {
  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: {
      salaryLines: {
        orderBy: { createdAt: 'asc' },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          expense: { select: { id: true, name: true, amount: true, status: true } },
        },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!run) throw new NotFoundException(`Payroll run ${id} not found`);

  const scopedLines = filterSalaryLinesByAccess(run.salaryLines, accessible);
  const releaseWhere = {
    payrollRunId: id,
    status: 'INCLUDED_IN_PAYROLL' as const,
    ...employeeIdWhere(accessible),
  };
  const [materializedByRun, auditTrail, includedBonusReleaseCount] = await Promise.all([
    fetchMaterializedSalaryLineCountByPayrollRunId(prisma, [id]),
    loadPayrollRunAuditTrail(prisma, PAYROLL_RUN_AUDIT_ENTITY_TYPE, id),
    prisma.bonusRelease.count({ where: releaseWhere }),
  ]);

  const header = overlayPayrollRunDetailTotals(
    omitLegacyPayrollKpiFields(run),
    scopedLines,
    accessible,
    materializedByRun.get(id) ?? 0,
  );
  return {
    ...header,
    salaryLines: scopedLines.map((line) => omitLegacyPayrollKpiFields(line)),
    journal: buildPayrollRunJournal(run),
    auditTrail,
    includedBonusReleaseCount,
  };
}
