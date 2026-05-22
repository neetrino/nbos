import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient, type Prisma } from '@nbos/database';

export interface PatchSalaryLineSalesKpiBody {
  kpiSalesPlanAmount?: number | null;
  kpiSalesActualAmount?: number | null;
}

function assertNonNegativeMoneyField(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new BadRequestException(`${label} must be a non-negative finite number`);
  }
}

export async function applySalaryLineSalesKpiPatch(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  salaryLineId: string,
  body: PatchSalaryLineSalesKpiBody,
): Promise<void> {
  const hasPatch = body.kpiSalesPlanAmount !== undefined || body.kpiSalesActualAmount !== undefined;
  if (!hasPatch) {
    throw new BadRequestException('No supported fields to update');
  }

  const line = await prisma.salaryLine.findFirst({
    where: { id: salaryLineId, payrollRunId },
    select: { id: true, employeeId: true, payrollRun: { select: { status: true } } },
  });
  if (!line) {
    throw new NotFoundException(`Salary line ${salaryLineId} not found on this payroll run`);
  }
  if (line.payrollRun.status !== 'DRAFT' && line.payrollRun.status !== 'REVIEW') {
    throw new BadRequestException(
      'Employee sales KPI can only be edited while the payroll run is DRAFT or REVIEW.',
    );
  }

  const attachedForEmployee = await prisma.bonusRelease.count({
    where: {
      payrollRunId,
      employeeId: line.employeeId,
      status: 'INCLUDED_IN_PAYROLL',
    },
  });
  if (attachedForEmployee > 0) {
    throw new BadRequestException(
      'Detach this employee’s bonus releases before changing sales KPI amounts.',
    );
  }

  if (body.kpiSalesPlanAmount != null) {
    assertNonNegativeMoneyField('kpiSalesPlanAmount', body.kpiSalesPlanAmount);
  }
  if (body.kpiSalesActualAmount != null) {
    assertNonNegativeMoneyField('kpiSalesActualAmount', body.kpiSalesActualAmount);
  }

  const data: Prisma.SalaryLineUpdateInput = {};
  if (body.kpiSalesPlanAmount !== undefined) {
    data.kpiSalesPlanAmount =
      body.kpiSalesPlanAmount === null ? null : new Decimal(body.kpiSalesPlanAmount);
  }
  if (body.kpiSalesActualAmount !== undefined) {
    data.kpiSalesActualAmount =
      body.kpiSalesActualAmount === null ? null : new Decimal(body.kpiSalesActualAmount);
  }

  await prisma.salaryLine.update({ where: { id: salaryLineId }, data });
}
