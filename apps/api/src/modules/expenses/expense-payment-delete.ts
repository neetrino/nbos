import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { assertPostingPeriodOpenForBookedAt } from '../finance/journal/posting-period-guard';
import { decodePayrollCashNotes } from '../payroll-runs/payroll-salary-first-cash-notes';
import {
  neutralizePayrollCashRefundsForSource,
  rejectClosedPayrollCashHistory,
  restoreBonusMarksForDeletedPayrollCash,
} from '../payroll-runs/payroll-salary-first-cash-reverse-apply';
import { syncSalaryLinePaidFromExpenseLedger } from '../payroll-runs/payroll-salary-line-ledger-sync';
import { syncExpenseStatusWithPaymentLedger } from './expense-status-ledger-sync';

/**
 * Deletes an expense payment and restores its original payroll salary and bonus links.
 * Does not rewrite the payment split. Closed payroll history is not edited in place.
 */
export async function deleteExpensePaymentRecord(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  paymentId: string,
  opts?: { notify?: WalletInAppNotifySink },
): Promise<void> {
  const row = await prisma.expensePayment.findFirst({
    where: { id: paymentId, expenseId },
  });
  if (!row) {
    throw new NotFoundException(`Expense payment ${paymentId} not found`);
  }
  await assertPostingPeriodOpenForBookedAt(prisma, row.paymentDate);
  await rejectClosedPayrollCashHistory(prisma, expenseId);
  const original = decodePayrollCashNotes(row.notes);
  await prisma.expensePayment.delete({ where: { id: paymentId } });
  await neutralizePayrollCashRefundsForSource(prisma, expenseId, paymentId);
  await syncExpenseStatusWithPaymentLedger(prisma, expenseId);
  await syncSalaryLinePaidFromExpenseLedger(prisma, expenseId, opts?.notify);
  await restoreBonusMarksForDeletedPayrollCash(prisma, expenseId, original);
}
