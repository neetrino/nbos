import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient, type PayrollRunStatusEnum } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { resolveDeliveryPayableUnits } from './delivery-payable-unit.resolver';
import { isPayrollMatrixBonusEntryVisible } from './payroll-bonus-release-base';
import { addPayrollMonths, enumeratePayrollMonths } from './payroll-salary-board';
import type { PayrollAllocationMatrixCell } from './payroll-allocation-matrix.types';
import {
  PAYROLL_EMPLOYEE_BONUS_HISTORY_MONTH_COUNT,
  type PayrollEmployeeBonusHistoryDto,
  type PayrollEmployeeBonusHistoryEmployeeDto,
  type PayrollEmployeeBonusHistoryMonthDto,
  type PayrollEmployeeBonusHistoryProjectDto,
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

export async function queryPayrollEmployeeBonusHistory(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  employeeId: string | undefined,
  focusCells: PayrollAllocationMatrixCell[],
  focusUnits: Awaited<ReturnType<typeof resolveDeliveryPayableUnits>>,
): Promise<PayrollEmployeeBonusHistoryDto> {
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

  const sortedEmployees = sortEmployees(employees);
  const selectedEmployeeId =
    employeeId && sortedEmployees.some((e) => e.employeeId === employeeId)
      ? employeeId
      : sortedEmployees[0].employeeId;

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
  const runIds = runsInWindow.map((r) => r.id);

  const releases =
    runIds.length === 0
      ? []
      : await prisma.bonusRelease.findMany({
          where: {
            payrollRunId: { in: runIds },
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

  const amountByMonthOrder = new Map<string, Decimal>();
  for (const release of releases) {
    if (!release.payrollRunId) continue;
    const monthRun = runsInWindow.find((r) => r.id === release.payrollRunId);
    if (!monthRun) continue;
    const key = `${monthRun.payrollMonth}:${release.bonusEntry.orderId}`;
    const amount = releaseIncludedAmount(
      decimalFrom(release.amount),
      release.payrollIncludedAmount != null ? decimalFrom(release.payrollIncludedAmount) : null,
    );
    const current = amountByMonthOrder.get(key) ?? BONUS_POOL_ZERO;
    amountByMonthOrder.set(key, current.plus(amount));
  }

  const focusCellsByOrder = new Map(
    focusCells.filter((c) => c.employeeId === selectedEmployeeId).map((c) => [c.orderId, c]),
  );

  const orderIdsWithHistory = new Set<string>(
    [...amountByMonthOrder.keys()].map((k) => k.split(':')[1]),
  );
  for (const cell of focusCellsByOrder.values()) {
    if (cell.linked || decimalFrom(cell.releaseThisMonth).gt(BONUS_POOL_ZERO)) {
      orderIdsWithHistory.add(cell.orderId);
    }
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: [...orderIdsWithHistory] } },
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

  const unitByOrderId = new Map(focusUnits.map((u) => [u.orderId, u]));

  const months: PayrollEmployeeBonusHistoryMonthDto[] = monthKeys.map((payrollMonth) => {
    const monthRun = runByMonth.get(payrollMonth) ?? null;
    const isFocusMonth = payrollMonth === payrollMonthTo;
    let monthBonusTotal = BONUS_POOL_ZERO;
    for (const [key, amount] of amountByMonthOrder) {
      if (key.startsWith(`${payrollMonth}:`)) {
        monthBonusTotal = monthBonusTotal.plus(amount);
      }
    }
    if (isFocusMonth && EDITABLE_STATUSES.has(run.status)) {
      monthBonusTotal = BONUS_POOL_ZERO;
      for (const cell of focusCellsByOrder.values()) {
        monthBonusTotal = monthBonusTotal.plus(decimalFrom(cell.releaseThisMonth));
      }
    }
    const runStatus = monthRun?.status ?? null;
    return {
      payrollMonth,
      payrollRunId: monthRun?.id ?? null,
      runStatus,
      isFocusMonth,
      monthBonusTotal: money(monthBonusTotal),
      readOnly: isFocusMonth ? !EDITABLE_STATUSES.has(run.status) : true,
    };
  });

  const projects: PayrollEmployeeBonusHistoryProjectDto[] = [];

  for (const orderId of orderIdsWithHistory) {
    const order = orders.find((o) => o.id === orderId);
    const unit = unitByOrderId.get(orderId);
    const focusCell = focusCellsByOrder.get(orderId) ?? null;

    const label =
      unit?.label ?? order?.product?.name ?? order?.extension?.name ?? order?.code ?? orderId;

    const linkedOnOrder =
      order?.bonusEntries.some(
        (b) =>
          b.employeeId === selectedEmployeeId &&
          isPayrollMatrixBonusEntryVisible(b, run.payrollMonth),
      ) ?? false;
    const hasPmRole =
      order?.product?.pmId === selectedEmployeeId ||
      order?.product?.developerId === selectedEmployeeId ||
      order?.product?.designerId === selectedEmployeeId;

    if (!linkedOnOrder && !hasPmRole && !focusCell && !unit) {
      const hasAnyAmount = monthKeys.some((m) => amountByMonthOrder.has(`${m}:${orderId}`));
      if (!hasAnyAmount) continue;
    }

    const monthAmounts = monthKeys.map((payrollMonth) => {
      const amount = amountByMonthOrder.get(`${payrollMonth}:${orderId}`);
      return amount != null && amount.gt(BONUS_POOL_ZERO) ? money(amount) : null;
    });

    projects.push({
      orderId,
      projectId: unit?.projectId ?? order?.projectId ?? orderId,
      projectCode: unit?.projectCode ?? order?.code ?? '',
      label,
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

  projects.sort((a, b) => a.label.localeCompare(b.label));

  return {
    payrollRunId: run.id,
    payrollMonth: run.payrollMonth,
    runStatus: run.status,
    editable: EDITABLE_STATUSES.has(run.status),
    payrollMonthFrom,
    payrollMonthTo,
    months,
    employees: sortedEmployees,
    selectedEmployeeId,
    projects,
  };
}
