import { Logger } from '@nestjs/common';

import type { BonusEntryWalletHint } from './employee-wallet-bonus-hint.types';
import { WALLET_NOTIFY_TYPES } from './employee-wallet-notify.constants';
import type { WalletInAppNotifySink } from './employee-wallet-notify.types';

const log = new Logger('WalletNotify');

export type { BonusEntryWalletHint } from './employee-wallet-bonus-hint.types';

async function safeNotify(
  sink: WalletInAppNotifySink | undefined,
  fn: (s: WalletInAppNotifySink) => Promise<unknown>,
): Promise<void> {
  if (!sink) {
    return;
  }
  try {
    await fn(sink);
  } catch (err) {
    log.warn(`wallet_notify_failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function publishBonusEntryWalletHints(
  sink: WalletInAppNotifySink | undefined,
  hints: BonusEntryWalletHint[],
): Promise<void> {
  for (const h of hints) {
    await safeNotify(sink, (s) =>
      s.create({
        type: WALLET_NOTIFY_TYPES.BONUS_ACTIVE,
        recipientId: h.employeeId,
        title: 'Bonus moved to payroll pipeline',
        body: `Order ${h.orderCode}: your bonus is now active for payroll.`,
        link: '/my-account/wallet',
        entityType: 'BonusEntry',
        entityId: h.entryId,
        sourceModule: 'finance',
        idempotencyKey: `wallet:bonus_active:${h.entryId}`,
      }),
    );
  }
}

export async function notifyBonusReleasePaid(
  sink: WalletInAppNotifySink | undefined,
  input: {
    employeeId: string;
    releaseId: string;
    orderCode: string;
    amountLabel: string;
    payrollMonth: string | null;
  },
): Promise<void> {
  const month = input.payrollMonth ? ` · ${input.payrollMonth}` : '';
  await safeNotify(sink, (s) =>
    s.create({
      type: WALLET_NOTIFY_TYPES.BONUS_PAID,
      recipientId: input.employeeId,
      title: 'Bonus payout recorded',
      body: `Order ${input.orderCode}: ${input.amountLabel} marked paid${month}.`,
      link: '/my-account/wallet',
      entityType: 'BonusRelease',
      entityId: input.releaseId,
      sourceModule: 'finance',
      idempotencyKey: `wallet:bonus_release_paid:${input.releaseId}`,
    }),
  );
}

export async function notifySalaryExpensePayment(
  sink: WalletInAppNotifySink | undefined,
  input: {
    employeeId: string;
    paymentId: string;
    payrollMonth: string;
    amountLabel: string;
    expenseId: string;
    lineStatus: string;
  },
): Promise<void> {
  const title = input.lineStatus === 'PAID' ? 'Salary fully paid' : 'Salary payment recorded';
  await safeNotify(sink, (s) =>
    s.create({
      type: WALLET_NOTIFY_TYPES.SALARY_PAYMENT,
      recipientId: input.employeeId,
      title,
      body: `Payroll ${input.payrollMonth}: ${input.amountLabel} (${input.lineStatus}).`,
      link: `/finance/expenses/${input.expenseId}`,
      entityType: 'ExpensePayment',
      entityId: input.paymentId,
      sourceModule: 'finance',
      idempotencyKey: `wallet:salary_payment:${input.paymentId}`,
    }),
  );
}

export async function notifyPayrollRunCreated(
  sink: WalletInAppNotifySink | undefined,
  input: { employeeId: string; payrollMonth: string; runId: string },
): Promise<void> {
  await safeNotify(sink, (s) =>
    s.create({
      type: WALLET_NOTIFY_TYPES.PAYROLL_CREATED,
      recipientId: input.employeeId,
      title: 'New payroll run',
      body: `Payroll opened for ${input.payrollMonth}.`,
      link: `/finance/payroll/${input.runId}`,
      entityType: 'PayrollRun',
      entityId: input.runId,
      sourceModule: 'finance',
      idempotencyKey: `wallet:payroll_created:${input.runId}:${input.employeeId}`,
    }),
  );
}

export async function notifyPayrollRunClosed(
  sink: WalletInAppNotifySink | undefined,
  input: { employeeId: string; payrollMonth: string; runId: string },
): Promise<void> {
  await safeNotify(sink, (s) =>
    s.create({
      type: WALLET_NOTIFY_TYPES.PAYROLL_CLOSED,
      recipientId: input.employeeId,
      title: 'Payroll closed',
      body: `Payroll ${input.payrollMonth} is closed.`,
      link: `/finance/payroll/${input.runId}`,
      entityType: 'PayrollRun',
      entityId: input.runId,
      sourceModule: 'finance',
      idempotencyKey: `wallet:payroll_closed:${input.runId}:${input.employeeId}`,
    }),
  );
}

export async function notifyBonusReleaseCorrected(
  sink: WalletInAppNotifySink | undefined,
  input: { employeeId: string; releaseId: string; orderCode: string; amountLabel: string },
): Promise<void> {
  await safeNotify(sink, (s) =>
    s.create({
      type: WALLET_NOTIFY_TYPES.BONUS_CORRECTED,
      recipientId: input.employeeId,
      title: 'Bonus release adjusted',
      body: `Order ${input.orderCode}: release updated to ${input.amountLabel}.`,
      link: '/my-account/wallet',
      entityType: 'BonusRelease',
      entityId: input.releaseId,
      sourceModule: 'finance',
      idempotencyKey: `wallet:bonus_corrected:${input.releaseId}:${input.amountLabel}`,
    }),
  );
}

export async function notifyBonusKpiReducedOnAttach(
  sink: WalletInAppNotifySink | undefined,
  input: {
    employeeId: string;
    releaseId: string;
    orderCode: string;
    body: string;
    burnedAmount: string;
  },
): Promise<void> {
  await safeNotify(sink, (s) =>
    s.create({
      type: WALLET_NOTIFY_TYPES.BONUS_KPI_REDUCED,
      recipientId: input.employeeId,
      title: 'Sales bonus reduced by KPI',
      body: input.body,
      link: '/my-account/wallet',
      entityType: 'BonusRelease',
      entityId: input.releaseId,
      sourceModule: 'finance',
      idempotencyKey: `wallet:bonus_kpi_reduced:${input.releaseId}:${input.burnedAmount}`,
    }),
  );
}
