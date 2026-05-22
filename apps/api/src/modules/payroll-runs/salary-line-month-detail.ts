import { NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { plannedDecimalForEntry } from '../employees/employee-wallet-bonus-release-rollups';
import { resolveCompensationPayoutPhase } from './compensation-payout-phase';
import {
  aggregateBonusBreakdownSummary,
  deriveBonusPolicyBreakdownStatuses,
} from './bonus-policy-breakdown-status';
import { sumPendingPayrollCarryOver } from './payroll-bonus-carry-over-apply';
import type {
  SalaryLineMonthBonusRow,
  SalaryLineMonthDetailDto,
  SalaryLineMonthPaymentRow,
} from './salary-line-month-detail.types';

function money(value: Decimal): string {
  return value.toFixed(2);
}

function bonusProductLabel(
  orderCode: string,
  productName: string | null,
  extensionName: string | null,
): string {
  if (productName) {
    return productName;
  }
  if (extensionName) {
    return extensionName;
  }
  return `Order ${orderCode}`;
}

function mapPayments(
  rows: Array<{ id: string; amount: Decimal; paymentDate: Date; notes: string | null }>,
): SalaryLineMonthPaymentRow[] {
  return rows
    .slice()
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
    .map((p) => ({
      id: p.id,
      amount: money(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      notes: p.notes,
    }));
}

function mapBonusRow(
  release: {
    id: string;
    amount: Decimal;
    payrollIncludedAmount: Decimal | null;
    kpiBurnedAmount: Decimal | null;
    payrollCarryOverAmount: Decimal | null;
    releaseType: string;
    status: string;
    reason: string | null;
    bonusEntry: {
      id: string;
      status: string;
      type: string;
      amount: Decimal;
      orderId: string;
      project: { id: string; code: string; name: string };
      order: { code: string };
    };
    product: { name: string } | null;
    extension: { name: string } | null;
  },
  paidByEntry: Map<string, Decimal>,
): SalaryLineMonthBonusRow {
  const planned = plannedDecimalForEntry(release.bonusEntry.amount);
  const paid = paidByEntry.get(release.bonusEntry.id) ?? new Decimal(0);
  const kpiBurned =
    release.kpiBurnedAmount != null && release.kpiBurnedAmount.gt(0)
      ? release.kpiBurnedAmount
      : null;
  const carryOver =
    release.payrollCarryOverAmount != null && release.payrollCarryOverAmount.gt(0)
      ? release.payrollCarryOverAmount
      : null;
  const policyBreakdownStatuses = deriveBonusPolicyBreakdownStatuses({
    entryStatus: release.bonusEntry.status,
    kpiBurnedAmount: kpiBurned,
    payrollCarryOverAmount: carryOver,
  });
  return {
    bonusEntryId: release.bonusEntry.id,
    bonusReleaseId: release.id,
    entryStatus: release.bonusEntry.status,
    type: release.bonusEntry.type,
    policyBreakdownStatuses,
    releaseType: release.releaseType,
    releaseStatus: release.status,
    projectId: release.bonusEntry.project.id,
    projectCode: release.bonusEntry.project.code,
    projectName: release.bonusEntry.project.name,
    orderCode: release.bonusEntry.order.code,
    productLabel: bonusProductLabel(
      release.bonusEntry.order.code,
      release.product?.name ?? null,
      release.extension?.name ?? null,
    ),
    plannedAmount: money(planned),
    releaseAmount: money(release.amount),
    includedAmount: release.payrollIncludedAmount ? money(release.payrollIncludedAmount) : null,
    kpiBurnedAmount: kpiBurned ? money(kpiBurned) : null,
    payrollCarryOverAmount: carryOver ? money(carryOver) : null,
    paidAmount: money(paid),
    remainingAmount: money(Decimal.max(new Decimal(0), planned.minus(paid))),
    reason: release.reason,
  };
}

async function loadBonusBreakdown(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  employeeId: string,
): Promise<SalaryLineMonthBonusRow[]> {
  const releases = await prisma.bonusRelease.findMany({
    where: {
      payrollRunId,
      employeeId,
      status: { in: ['INCLUDED_IN_PAYROLL', 'PAID'] },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      bonusEntry: {
        select: {
          id: true,
          status: true,
          type: true,
          amount: true,
          orderId: true,
          project: { select: { id: true, code: true, name: true } },
          order: { select: { code: true } },
        },
      },
      product: { select: { name: true } },
      extension: { select: { name: true } },
    },
  });

  const entryIds = releases.map((r) => r.bonusEntryId);
  const paidGroups =
    entryIds.length === 0
      ? []
      : await prisma.bonusRelease.groupBy({
          by: ['bonusEntryId'],
          where: { bonusEntryId: { in: entryIds }, status: 'PAID' },
          _sum: { amount: true },
        });

  const paidByEntry = new Map(
    paidGroups.map((g) => [g.bonusEntryId, g._sum.amount ?? new Decimal(0)] as const),
  );

  return releases.map((r) => mapBonusRow(r, paidByEntry));
}

/** Finance / Wallet month detail for one employee salary line (NBOS Employee Month Compensation). */
export async function querySalaryLineMonthDetail(
  prisma: InstanceType<typeof PrismaClient>,
  salaryLineId: string,
): Promise<SalaryLineMonthDetailDto> {
  const line = await prisma.salaryLine.findUnique({
    where: { id: salaryLineId },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true, position: true },
      },
      payrollRun: {
        select: {
          id: true,
          payrollMonth: true,
          status: true,
          kpiSalesPlanAmount: true,
          kpiSalesActualAmount: true,
        },
      },
      expense: {
        select: {
          id: true,
          name: true,
          amount: true,
          status: true,
          expensePayments: {
            orderBy: { paymentDate: 'asc' },
            select: { id: true, amount: true, paymentDate: true, notes: true },
          },
        },
      },
    },
  });

  if (!line) {
    throw new NotFoundException(`Salary line ${salaryLineId} not found`);
  }

  const bonusBreakdown = await loadBonusBreakdown(prisma, line.payrollRunId, line.employeeId);
  const pendingCarry = await sumPendingPayrollCarryOver(
    prisma,
    line.employeeId,
    line.payrollRun.payrollMonth,
  );
  const summaryAgg = aggregateBonusBreakdownSummary(
    bonusBreakdown.map((row) => ({
      entryStatus: row.entryStatus,
      kpiBurnedAmount: row.kpiBurnedAmount != null ? new Decimal(row.kpiBurnedAmount) : null,
      payrollCarryOverAmount:
        row.payrollCarryOverAmount != null ? new Decimal(row.payrollCarryOverAmount) : null,
    })),
    pendingCarry,
  );

  const expensePayments = line.expense?.expensePayments ?? [];
  const paidFromExpense = expensePayments.reduce((acc, p) => acc.plus(p.amount), new Decimal(0));
  const expenseRemaining = line.expense
    ? Decimal.max(new Decimal(0), line.expense.amount.minus(paidFromExpense))
    : new Decimal(0);

  const payoutPhase = resolveCompensationPayoutPhase({
    payrollMonth: line.payrollRun.payrollMonth,
    runStatus: line.payrollRun.status,
    lineStatus: line.status,
  });

  return {
    payoutPhase,
    pendingPayrollCarryOver: pendingCarry.gt(0) ? money(pendingCarry) : null,
    employee: line.employee,
    payrollMonth: line.payrollRun.payrollMonth,
    payrollRun: {
      id: line.payrollRun.id,
      status: line.payrollRun.status,
      kpiSalesPlanAmount: line.payrollRun.kpiSalesPlanAmount?.toFixed(2) ?? null,
      kpiSalesActualAmount: line.payrollRun.kpiSalesActualAmount?.toFixed(2) ?? null,
    },
    salaryLine: {
      id: line.id,
      status: line.status,
      baseSalary: money(line.baseSalary),
      bonusesTotal: money(line.bonusesTotal),
      adjustmentsTotal: money(line.adjustmentsTotal),
      deductionsTotal: money(line.deductionsTotal),
      totalPayable: money(line.totalPayable),
      paidAmount: money(line.paidAmount),
      remainingAmount: money(line.remainingAmount),
      compensationProfileId: line.compensationProfileId,
    },
    expense: line.expense
      ? {
          id: line.expense.id,
          name: line.expense.name,
          amount: money(line.expense.amount),
          status: line.expense.status,
          paymentStatus:
            paidFromExpense.gte(line.expense.amount) && line.expense.amount.gt(0)
              ? 'PAID'
              : paidFromExpense.gt(0)
                ? 'PARTIAL'
                : 'UNPAID',
          paidAmount: money(paidFromExpense),
          remainingAmount: money(expenseRemaining),
          payments: mapPayments(expensePayments),
        }
      : null,
    bonusBreakdownSummary: {
      incomingCount: summaryAgg.incomingCount,
      burnedTotal: money(summaryAgg.burnedTotal),
      carryOverTotal: money(summaryAgg.carryOverTotal),
      clawbackCount: summaryAgg.clawbackCount,
    },
    bonusBreakdown,
  };
}
