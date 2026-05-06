import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient, type Prisma } from '@nbos/database';

export interface PatchPayrollRunBody {
  kpiSalesPlanAmount?: number | null;
  kpiSalesActualAmount?: number | null;
}

function assertNonNegativeMoneyField(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new BadRequestException(`${label} must be a non-negative finite number`);
  }
}

/**
 * Persists monthly sales plan / actual for seller KPI payout gate (NBOS § KPI).
 * Caller should re-load the run for API responses.
 */
export async function applyPayrollRunKpiPatch(
  prisma: InstanceType<typeof PrismaClient>,
  id: string,
  body: PatchPayrollRunBody,
): Promise<void> {
  const hasPatch = body.kpiSalesPlanAmount !== undefined || body.kpiSalesActualAmount !== undefined;
  if (!hasPatch) {
    throw new BadRequestException('No supported fields to update');
  }

  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) {
    throw new NotFoundException(`Payroll run ${id} not found`);
  }
  if (run.status !== 'DRAFT' && run.status !== 'REVIEW') {
    throw new BadRequestException(
      'Payroll run KPI fields can only be edited while status is DRAFT or REVIEW.',
    );
  }

  const attached = await prisma.bonusRelease.count({
    where: { payrollRunId: id, status: 'INCLUDED_IN_PAYROLL' },
  });
  if (attached > 0) {
    throw new BadRequestException(
      'Detach all bonus releases from this payroll run before changing sales KPI amounts.',
    );
  }

  if (body.kpiSalesPlanAmount != null) {
    assertNonNegativeMoneyField('kpiSalesPlanAmount', body.kpiSalesPlanAmount);
  }
  if (body.kpiSalesActualAmount != null) {
    assertNonNegativeMoneyField('kpiSalesActualAmount', body.kpiSalesActualAmount);
  }

  const data: Prisma.PayrollRunUpdateInput = {};
  if (body.kpiSalesPlanAmount !== undefined) {
    data.kpiSalesPlanAmount =
      body.kpiSalesPlanAmount === null ? null : new Decimal(body.kpiSalesPlanAmount);
  }
  if (body.kpiSalesActualAmount !== undefined) {
    data.kpiSalesActualAmount =
      body.kpiSalesActualAmount === null ? null : new Decimal(body.kpiSalesActualAmount);
  }

  await prisma.payrollRun.update({ where: { id }, data });
}
