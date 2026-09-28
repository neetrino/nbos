import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { moneyAmount } from './payroll-allocation-source-amounts';
import type { PayrollCashPaymentNotes } from './payroll-salary-first-cash-notes';
import {
  decodePayrollCashRefundNotes,
  netPayrollCashAttribution,
  type EncodedPayrollCashRefund,
} from './payroll-salary-first-cash-reverse';

export const PAYROLL_CASH_LEDGER_PAYMENT_SELECT = {
  id: true,
  amount: true,
  notes: true,
} as const;

export function refundStoredCashAmount(refund: EncodedPayrollCashRefund): Decimal {
  const restored = refund.bonusParts.reduce((sum, part) => sum.plus(part.amount), BONUS_POOL_ZERO);
  return moneyAmount(restored.negated());
}

export function hasPayrollCashRefundNotes(payments: readonly { notes?: string | null }[]): boolean {
  return payments.some((payment) => decodePayrollCashRefundNotes(payment.notes ?? null) != null);
}

export function payrollCashLedgerPaidAmount(payments: readonly PayrollCashPaymentNotes[]): Decimal {
  const net = netPayrollCashAttribution(payments);
  let bonusPaid = BONUS_POOL_ZERO;
  for (const amount of net.bonusPaidById.values()) {
    bonusPaid = bonusPaid.plus(moneyAmount(Decimal.max(BONUS_POOL_ZERO, amount)));
  }
  return moneyAmount(
    Decimal.max(BONUS_POOL_ZERO, net.salaryPaid.plus(bonusPaid).plus(net.carryPaid)),
  );
}
