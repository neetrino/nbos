import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient, type PayrollRunStatusEnum } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import type { DeliveryPayableUnitDto } from './delivery-payable-unit.types';
import { isPayrollMatrixBonusEntryVisible } from './payroll-bonus-release-base';
import { addPayrollMonths, enumeratePayrollMonths } from './payroll-salary-board';
import type { PayrollAllocationMatrixCell } from './payroll-allocation-matrix.types';
import {
  PAYROLL_EMPLOYEE_BONUS_HISTORY_MONTH_COUNT,
  type PayrollEmployeeBonusHistoryDto,
  type PayrollEmployeeBonusHistoryEmployeeDto,
  type PayrollEmployeeBonusHistoryMetaDto,
  type PayrollEmployeeBonusHistoryMonthDto,
  type PayrollEmployeeBonusHistoryProjectDto,
  type PayrollEmployeeBonusHistorySliceDto,
} from './payroll-employee-bonus-history.types';

const EDITABLE_STATUSES = new Set<PayrollRunStatusEnum>(['DRAFT']);

function money(value: Decimal): string {
  return value.toFixed(2);
}

function releaseIncludedAmount(amount: Decimal, included: Decimal | null): Decimal {
  return included != null && included.gt(BONUS_POOL_ZERO) ? included : amount;
}

function employeeName(e: { firstName: string; lastName: string }): string {
  return `${e.firstName} ${e.lastName}`.trim();
}

function sortEmployees(
  rows: PayrollEmployeeBonusHistoryEmployeeDto[],
): PayrollEmployeeBonusHistoryEmployeeDto[] {
  return rows.slice().sort((a, b) => employeeName(a).localeCompare(employeeName(b)));
}

type RunContext = {
  run: {
    id: string;
    payrollMonth: string;
    status: PayrollRunStatusEnum;
    salaryLines: Array<{
      id: string;
      bonusesTotal: Decimal | string;
      employee: {
        id: string;
        firstName: string;
        lastName: string;
        position: string | null;
      };
    }>;
  };
  employees: PayrollEmployeeBonusHistoryEmployeeDto[];
  monthKeys: string[];
  payrollMonthFrom: string;
  payrollMonthTo: string;
  runsInWindow: Array<{ id: string; payrollMonth: string; status: PayrollRunStatusEnum }>;
  runByMonth: Map<string, { id: string; payrollMonth: string; status: PayrollRunStatusEnum }>;
  runIds: string[];
};

async function loadRunContext(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
): Promise<RunContext> {
  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      salaryLines: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, position: true },
          },
        },
      },
    },
  });
  if (!run) throw new NotFoundException('Payroll run not found');

  const employees: PayrollEmployeeBonusHistoryEmployeeDto[] = run.salaryLines.map((line) => ({
    employeeId: line.employee.id,
    firstName: line.employee.firstName,
    lastName: line.employee.lastName,
    position: line.employee.position,
    salaryLineId: line.id,
    bonusTotalThisRun: decimalFrom(line.bonusesTotal).toFixed(2),
  }));

  if (employees.length === 0) {
    throw new BadRequestException('Payroll run has no salary lines');
  }

  const payrollMonthTo = run.payrollMonth;
  const payrollMonthFrom = addPayrollMonths(
    payrollMonthTo,
    -(PAYROLL_EMPLOYEE_BONUS_HISTORY_MONTH_COUNT - 1),
  );
  const monthKeys = enumeratePayrollMonths(payrollMonthFrom, payrollMonthTo);

  const runsInWindow = await prisma.payrollRun.findMany({
    where: { payrollMonth: { in: monthKeys } },
    select: { id: true, payrollMonth: true, status: true },
  });
  const runByMonth = new Map(runsInWindow.map((r) => [r.payrollMonth, r]));

  return {
    run,
    employees: sortEmployees(employees),
    monthKeys,
    payrollMonthFrom,
    payrollMonthTo,
    runsInWindow,
    runByMonth,
    runIds: runsInWindow.map((r) => r.id),
  };
}

function buildMonthHeaders(
  ctx: RunContext,
  monthBonusTotals?: Map<string, string>,
): PayrollEmployeeBonusHistoryMonthDto[] {
  const editable = EDITABLE_STATUSES.has(ctx.run.status);
  return ctx.monthKeys.map((payrollMonth) => {
    const monthRun = ctx.runByMonth.get(payrollMonth) ?? null;
    const isFocusMonth = payrollMonth === ctx.payrollMonthTo;
    return {
      payrollMonth,
      payrollRunId: monthRun?.id ?? null,
      runStatus: monthRun?.status ?? null,
      isFocusMonth,
      monthBonusTotal: monthBonusTotals?.get(payrollMonth) ?? '0.00',
      readOnly: isFocusMonth ? !editable : true,
    };
  });
}

function buildMetaMonths(ctx: RunContext): PayrollEmployeeBonusHistoryMetaDto['months'] {
  const editable = EDITABLE_STATUSES.has(ctx.run.status);
  return ctx.monthKeys.map((payrollMonth) => {
    const monthRun = ctx.runByMonth.get(payrollMonth) ?? null;
    const isFocusMonth = payrollMonth === ctx.payrollMonthTo;
    return {
      payrollMonth,
      payrollRunId: monthRun?.id ?? null,
      runStatus: monthRun?.status ?? null,
      isFocusMonth,
      readOnly: isFocusMonth ? !editable : true,
    };
  });
}

async function loadAmountByMonthOrder(
  prisma: InstanceType<typeof PrismaClient>,
  ctx: RunContext,
  selectedEmployeeId: string,
): Promise<Map<string, Decimal>> {
  const amountByMonthOrder = new Map<string, Decimal>();
  if (ctx.runIds.length === 0) return amountByMonthOrder;

  const releases = await prisma.bonusRelease.findMany({
    where: {
      payrollRunId: { in: ctx.runIds },
      status: { in: ['INCLUDED_IN_PAYROLL', 'PAID'] },
      bonusEntry: { employeeId: selectedEmployeeId },
    },
    select: {
      amount: true,
      payrollIncludedAmount: true,
      payrollRunId: true,
      bonusEntry: { select: { orderId: true } },
    },
  });

  for (const release of releases) {
    if (!release.payrollRunId) continue;
    const monthRun = ctx.runsInWindow.find((r) => r.id === release.payrollRunId);
    if (!monthRun) continue;
    const key = `${monthRun.payrollMonth}:${release.bonusEntry.orderId}`;
    const amount = releaseIncludedAmount(
      decimalFrom(release.amount),
      release.payrollIncludedAmount != null ? decimalFrom(release.payrollIncludedAmount) : null,
    );
    const current = amountByMonthOrder.get(key) ?? BONUS_POOL_ZERO;
    amountByMonthOrder.set(key, current.plus(amount));
  }

  return amountByMonthOrder;
}

function collectOrderIds(
  amountByMonthOrder: Map<string, Decimal>,
  focusCellsByOrder: Map<string, PayrollAllocationMatrixCell>,
): Set<string> {
  const orderIdsWithHistory = new Set<string>(
    [...amountByMonthOrder.keys()].map((k) => k.split(':')[1] ?? ''),
  );
  for (const cell of focusCellsByOrder.values()) {
    if (cell.linked || decimalFrom(cell.releaseThisMonth).gt(BONUS_POOL_ZERO)) {
      orderIdsWithHistory.add(cell.orderId);
    }
  }
  return orderIdsWithHistory;
}

async function loadOrdersForProjects(
  prisma: InstanceType<typeof PrismaClient>,
  orderIds: string[],
  payrollMonth: string,
) {
  if (orderIds.length === 0) return [];
  return prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: {
      id: true,
      code: true,
      projectId: true,
      product: { select: { name: true, pmId: true, developerId: true, designerId: true } },
      extension: { select: { name: true } },
      bonusEntries: {
        select: {
          employeeId: true,
          earnedPeriod: true,
          status: true,
          type: true,
          amount: true,
          payableAmount: true,
        },
      },
    },
  });
}

function buildProjectsForEmployee(params: {
  ctx: RunContext;
  selectedEmployeeId: string;
  amountByMonthOrder: Map<string, Decimal>;
  focusCellsByOrder: Map<string, PayrollAllocationMatrixCell>;
  focusUnits: DeliveryPayableUnitDto[];
  includeFocusCells: boolean;
}): PayrollEmployeeBonusHistoryProjectDto[] {
  const { ctx, selectedEmployeeId, amountByMonthOrder, focusCellsByOrder, focusUnits } = params;
  const orderIdsWithHistory = collectOrderIds(amountByMonthOrder, focusCellsByOrder);
  const unitByOrderId = new Map(focusUnits.map((u) => [u.orderId, u]));
  const projects: PayrollEmployeeBonusHistoryProjectDto[] = [];

  for (const orderId of orderIdsWithHistory) {
    const unit = unitByOrderId.get(orderId);
    const focusCell = params.includeFocusCells ? (focusCellsByOrder.get(orderId) ?? null) : null;

    const monthAmounts = ctx.monthKeys.map((payrollMonth) => {
      const amount = amountByMonthOrder.get(`${payrollMonth}:${orderId}`);
      return amount != null && amount.gt(BONUS_POOL_ZERO) ? money(amount) : null;
    });

    projects.push({
      orderId,
      projectId: unit?.projectId ?? orderId,
      projectCode: unit?.projectCode ?? '',
      label: unit?.label ?? orderId,
      deliveryOpen: unit?.deliveryOpen ?? false,
      totalPlannedBonus: unit?.totalPlannedBonus ?? '0.00',
      totalReleasedBonus: unit?.totalReleasedBonus ?? '0.00',
      totalPaidBonus: unit?.totalPaidBonus ?? '0.00',
      totalRemainingBonus: unit?.totalRemainingBonus ?? '0.00',
      availableFunding: unit?.availableFunding ?? '0.00',
      monthAmounts,
      focusCell,
    });
  }

  return projects.sort((a, b) => a.label.localeCompare(b.label));
}

async function enrichProjectLabels(
  prisma: InstanceType<typeof PrismaClient>,
  ctx: RunContext,
  selectedEmployeeId: string,
  projects: PayrollEmployeeBonusHistoryProjectDto[],
  focusUnits: DeliveryPayableUnitDto[],
): Promise<PayrollEmployeeBonusHistoryProjectDto[]> {
  const orders = await loadOrdersForProjects(
    prisma,
    projects.map((p) => p.orderId),
    ctx.run.payrollMonth,
  );
  const unitByOrderId = new Map(focusUnits.map((u) => [u.orderId, u]));

  return projects
    .filter((project) => {
      const order = orders.find((o) => o.id === project.orderId);
      const unit = unitByOrderId.get(project.orderId);
      const focusCell = project.focusCell;

      const linkedOnOrder =
        order?.bonusEntries.some(
          (b) =>
            b.employeeId === selectedEmployeeId &&
            isPayrollMatrixBonusEntryVisible(b, ctx.run.payrollMonth),
        ) ?? false;
      const hasPmRole =
        order?.product?.pmId === selectedEmployeeId ||
        order?.product?.developerId === selectedEmployeeId ||
        order?.product?.designerId === selectedEmployeeId;

      if (!linkedOnOrder && !hasPmRole && !focusCell && !unit) {
        const hasAnyAmount = project.monthAmounts.some((a) => a != null);
        if (!hasAnyAmount) return false;
      }
      return true;
    })
    .map((project) => {
      const order = orders.find((o) => o.id === project.orderId);
      const unit = unitByOrderId.get(project.orderId);
      const label =
        unit?.label ??
        order?.product?.name ??
        order?.extension?.name ??
        order?.code ??
        project.orderId;
      return {
        ...project,
        projectId: unit?.projectId ?? order?.projectId ?? project.orderId,
        projectCode: unit?.projectCode ?? order?.code ?? '',
        label,
        deliveryOpen: unit?.deliveryOpen ?? project.deliveryOpen,
        totalPlannedBonus: unit?.totalPlannedBonus ?? project.totalPlannedBonus,
        totalReleasedBonus: unit?.totalReleasedBonus ?? project.totalReleasedBonus,
        totalPaidBonus: unit?.totalPaidBonus ?? project.totalPaidBonus,
        totalRemainingBonus: unit?.totalRemainingBonus ?? project.totalRemainingBonus,
        availableFunding: unit?.availableFunding ?? project.availableFunding,
      };
    });
}

function computeMonthBonusTotals(
  ctx: RunContext,
  amountByMonthOrder: Map<string, Decimal>,
  focusCellsByOrder: Map<string, PayrollAllocationMatrixCell>,
): Map<string, string> {
  const totals = new Map<string, string>();
  const editable = EDITABLE_STATUSES.has(ctx.run.status);

  for (const payrollMonth of ctx.monthKeys) {
    const isFocusMonth = payrollMonth === ctx.payrollMonthTo;
    let monthBonusTotal = BONUS_POOL_ZERO;
    for (const [key, amount] of amountByMonthOrder) {
      if (key.startsWith(`${payrollMonth}:`)) {
        monthBonusTotal = monthBonusTotal.plus(amount);
      }
    }
    if (isFocusMonth && editable) {
      monthBonusTotal = BONUS_POOL_ZERO;
      for (const cell of focusCellsByOrder.values()) {
        monthBonusTotal = monthBonusTotal.plus(decimalFrom(cell.releaseThisMonth));
      }
    }
    totals.set(payrollMonth, money(monthBonusTotal));
  }

  return totals;
}

export async function queryPayrollEmployeeBonusHistoryMeta(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  focusUnits: DeliveryPayableUnitDto[],
): Promise<PayrollEmployeeBonusHistoryMetaDto> {
  const ctx = await loadRunContext(prisma, payrollRunId);
  return {
    payrollRunId: ctx.run.id,
    payrollMonth: ctx.run.payrollMonth,
    runStatus: ctx.run.status,
    editable: EDITABLE_STATUSES.has(ctx.run.status),
    payrollMonthFrom: ctx.payrollMonthFrom,
    payrollMonthTo: ctx.payrollMonthTo,
    months: buildMetaMonths(ctx),
    employees: ctx.employees,
    deliveryUnits: focusUnits,
  };
}

export async function queryPayrollEmployeeBonusHistorySlice(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  employeeId: string,
  focusUnits: DeliveryPayableUnitDto[],
): Promise<PayrollEmployeeBonusHistorySliceDto> {
  const ctx = await loadRunContext(prisma, payrollRunId);
  if (!ctx.employees.some((e) => e.employeeId === employeeId)) {
    throw new BadRequestException('Employee is not on this payroll run');
  }

  const amountByMonthOrder = await loadAmountByMonthOrder(prisma, ctx, employeeId);
  const focusCellsByOrder = new Map<string, PayrollAllocationMatrixCell>();

  let projects = buildProjectsForEmployee({
    ctx,
    selectedEmployeeId: employeeId,
    amountByMonthOrder,
    focusCellsByOrder,
    focusUnits,
    includeFocusCells: false,
  });
  projects = await enrichProjectLabels(prisma, ctx, employeeId, projects, focusUnits);

  const monthBonusTotals = computeMonthBonusTotals(ctx, amountByMonthOrder, focusCellsByOrder);

  return {
    employeeId,
    months: ctx.monthKeys.map((payrollMonth) => ({
      payrollMonth,
      monthBonusTotal: monthBonusTotals.get(payrollMonth) ?? '0.00',
    })),
    projects: projects.map(({ focusCell: _fc, ...rest }) => rest),
  };
}

/** Full payload (legacy) — includes matrix focus cells. */
export async function queryPayrollEmployeeBonusHistory(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  employeeId: string | undefined,
  focusCells: PayrollAllocationMatrixCell[],
  focusUnits: DeliveryPayableUnitDto[],
): Promise<PayrollEmployeeBonusHistoryDto> {
  const ctx = await loadRunContext(prisma, payrollRunId);
  const selectedEmployeeId =
    employeeId && ctx.employees.some((e) => e.employeeId === employeeId)
      ? employeeId
      : ctx.employees[0].employeeId;

  const amountByMonthOrder = await loadAmountByMonthOrder(prisma, ctx, selectedEmployeeId);
  const focusCellsByOrder = new Map(
    focusCells.filter((c) => c.employeeId === selectedEmployeeId).map((c) => [c.orderId, c]),
  );

  let projects = buildProjectsForEmployee({
    ctx,
    selectedEmployeeId,
    amountByMonthOrder,
    focusCellsByOrder,
    focusUnits,
    includeFocusCells: true,
  });
  projects = await enrichProjectLabels(prisma, ctx, selectedEmployeeId, projects, focusUnits);

  const monthBonusTotals = computeMonthBonusTotals(ctx, amountByMonthOrder, focusCellsByOrder);

  return {
    payrollRunId: ctx.run.id,
    payrollMonth: ctx.run.payrollMonth,
    runStatus: ctx.run.status,
    editable: EDITABLE_STATUSES.has(ctx.run.status),
    payrollMonthFrom: ctx.payrollMonthFrom,
    payrollMonthTo: ctx.payrollMonthTo,
    months: buildMonthHeaders(ctx, monthBonusTotals),
    employees: ctx.employees,
    selectedEmployeeId,
    projects,
  };
}
