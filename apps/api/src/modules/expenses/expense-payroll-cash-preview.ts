import { Decimal, type PrismaClient } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { moneyText } from '../payroll-runs/payroll-allocation-source-amounts';
import {
  assignableBonusesFromReleases,
  type PayrollCashReleaseRow,
} from '../payroll-runs/payroll-salary-first-cash-apply';
import {
  carryRemainingBeforeCash,
  salaryRemainingBeforeCash,
} from '../payroll-runs/payroll-salary-first-cash';
import { sumEncodedCarryCash } from '../payroll-runs/payroll-salary-first-cash-notes';
import { payrollAlreadyPaidCash } from './expense-payment-create';
import { sumExpensePaymentAmounts } from './expense-payment-rollup';

export type ExpensePayrollCashBonusPreview = {
  bonusReleaseId: string;
  title: string | null;
  orderCode: string | null;
  remaining: string;
};

export type ExpensePayrollCashPreview = {
  baseSalary: string;
  salaryRemaining: string;
  carryRemaining: string;
  bonuses: ExpensePayrollCashBonusPreview[];
};

type PreviewPayment = { id: string; amount: Decimal; notes: string | null };

type PreviewSalaryLine = {
  employeeId?: string;
  payrollRunId?: string;
  baseSalary?: Decimal | null;
  payrollCarryAppliedAmount?: Decimal | null;
} | null;

type PreviewRelease = PayrollCashReleaseRow & {
  title: string | null;
  orderCode: string | null;
};

type ReadySalaryLine = {
  employeeId: string;
  payrollRunId: string;
  baseSalary: Decimal;
  payrollCarryAppliedAmount?: Decimal | null;
};

/**
 * Salary still unpaid on this expense, plus each included bonus the financier can name.
 * Missing salary fields mean this expense is not a payroll cash card.
 */
export async function loadExpensePayrollCashPreview(
  prisma: Pick<PrismaClient, 'bonusRelease'>,
  salaryLine: PreviewSalaryLine,
  payments: PreviewPayment[],
): Promise<ExpensePayrollCashPreview | null> {
  const ready = readySalaryLine(salaryLine);
  if (ready == null) {
    return null;
  }
  const releases = await prisma.bonusRelease.findMany({
    where: {
      payrollRunId: ready.payrollRunId,
      employeeId: ready.employeeId,
      status: 'INCLUDED_IN_PAYROLL',
    },
    select: {
      id: true,
      amount: true,
      payrollIncludedAmount: true,
      status: true,
      bonusEntry: { select: { title: true, order: { select: { code: true } } } },
    },
  });
  return buildExpensePayrollCashPreview({
    baseSalary: ready.baseSalary,
    carryAppliedAmount: ready.payrollCarryAppliedAmount ?? null,
    payments,
    releases: releases.map(mapPreviewRelease),
  });
}

export function buildExpensePayrollCashPreview(input: {
  baseSalary: Decimal;
  carryAppliedAmount: Decimal | null;
  payments: PreviewPayment[];
  releases: PreviewRelease[];
}): ExpensePayrollCashPreview {
  const paid = payrollAlreadyPaidCash(input.payments, sumExpensePaymentAmounts(input.payments));
  const labels = new Map(input.releases.map((row) => [row.id, row]));
  const bonuses = assignableBonusesFromReleases(input.releases, input.payments);
  return {
    baseSalary: moneyText(input.baseSalary),
    salaryRemaining: moneyText(salaryRemainingBeforeCash(input.baseSalary, paid)),
    carryRemaining: moneyText(
      carryRemainingBeforeCash(input.carryAppliedAmount, sumEncodedCarryCash(input.payments)),
    ),
    bonuses: bonuses
      .filter((bonus) => bonus.remaining.gt(BONUS_POOL_ZERO))
      .map((bonus) => {
        const label = labels.get(bonus.bonusReleaseId);
        return {
          bonusReleaseId: bonus.bonusReleaseId,
          title: label?.title ?? null,
          orderCode: label?.orderCode ?? null,
          remaining: moneyText(bonus.remaining),
        };
      }),
  };
}

function readySalaryLine(salaryLine: PreviewSalaryLine): ReadySalaryLine | null {
  if (salaryLine?.baseSalary == null) return null;
  if (typeof salaryLine.employeeId !== 'string') return null;
  if (typeof salaryLine.payrollRunId !== 'string') return null;
  return {
    employeeId: salaryLine.employeeId,
    payrollRunId: salaryLine.payrollRunId,
    baseSalary: salaryLine.baseSalary,
    payrollCarryAppliedAmount: salaryLine.payrollCarryAppliedAmount,
  };
}

function mapPreviewRelease(row: {
  id: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
  status: string;
  bonusEntry: { title: string | null; order: { code: string } | null } | null;
}): PreviewRelease {
  return {
    id: row.id,
    amount: row.amount,
    payrollIncludedAmount: row.payrollIncludedAmount,
    status: row.status,
    title: row.bonusEntry?.title ?? null,
    orderCode: row.bonusEntry?.order?.code ?? null,
  };
}
