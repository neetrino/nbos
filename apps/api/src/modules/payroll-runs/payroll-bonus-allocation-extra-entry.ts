import { Decimal, type PrismaClient, type TransactionClient } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { applyPayableSnapshotToBonusEntry } from '../bonus/bonus-payable-snapshot';
import { earnedBonusPeriodForPayoutMonth } from './earned-sales-kpi-period';
import { payrollAllocationDraftDisplayTitle } from './payroll-allocation-source-amounts';

type ExtraTx = TransactionClient;

const PAYROLL_EXTRA_AWARD_FLAG = 'payrollExtraAward';

export type PayrollExtraAwardDraft = {
  employeeId: string;
  orderId: string;
  projectId: string;
  amount: Decimal;
  title: string | null;
};

function isPayrollExtraAwardSnapshot(snapshot: unknown, payrollRunId: string): boolean {
  if (snapshot == null || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return false;
  }
  const record = snapshot as Record<string, unknown>;
  return record[PAYROLL_EXTRA_AWARD_FLAG] === true && record.payrollRunId === payrollRunId;
}

async function findPayrollExtraBonusEntry(
  tx: ExtraTx,
  params: {
    employeeId: string;
    orderId: string;
    amount: Decimal;
    payrollRunId: string;
  },
): Promise<string | null> {
  const matches = await tx.bonusEntry.findMany({
    where: {
      employeeId: params.employeeId,
      orderId: params.orderId,
      amount: params.amount,
    },
    select: { id: true, calculationSnapshot: true },
  });
  const found = matches.find((row) =>
    isPayrollExtraAwardSnapshot(row.calculationSnapshot, params.payrollRunId),
  );
  return found?.id ?? null;
}

async function createPayrollExtraBonusEntry(
  tx: ExtraTx,
  draft: PayrollExtraAwardDraft,
  payrollMonth: string,
  payrollRunId: string,
  amount: Decimal,
): Promise<string> {
  const created = await tx.bonusEntry.create({
    data: {
      title: payrollAllocationDraftDisplayTitle(draft.title),
      employeeId: draft.employeeId,
      orderId: draft.orderId,
      projectId: draft.projectId,
      type: 'DELIVERY',
      amount,
      originalAmount: amount,
      percent: BONUS_POOL_ZERO,
      status: 'ACTIVE',
      earnedPeriod: earnedBonusPeriodForPayoutMonth(payrollMonth),
      calculationSnapshot: {
        [PAYROLL_EXTRA_AWARD_FLAG]: true,
        payrollRunId,
      },
    },
  });
  await applyPayableSnapshotToBonusEntry(tx as InstanceType<typeof PrismaClient>, created.id);
  return created.id;
}

/** Extra Development awards are a new entry. The original plan amount stays unchanged. */
export async function ensurePayrollExtraBonusEntry(
  tx: ExtraTx,
  draft: PayrollExtraAwardDraft,
  payrollMonth: string,
  payrollRunId: string,
): Promise<string> {
  const amount = decimalFrom(draft.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const existing = await findPayrollExtraBonusEntry(tx, {
    employeeId: draft.employeeId,
    orderId: draft.orderId,
    amount,
    payrollRunId,
  });
  if (existing != null) return existing;
  return createPayrollExtraBonusEntry(tx, draft, payrollMonth, payrollRunId, amount);
}
