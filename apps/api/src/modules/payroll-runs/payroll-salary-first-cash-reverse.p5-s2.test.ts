import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { decodePayrollCashNotes, encodePayrollCashNotes } from './payroll-salary-first-cash-notes';
import {
  allocateSalaryFirstCash,
  parsePayrollCashBonusAssignments,
} from './payroll-salary-first-cash';
import { payrollCashLedgerPaidAmount } from './payroll-salary-first-cash-reverse-paid';
import {
  decodePayrollCashRefundNotes,
  encodePayrollCashRefundNotes,
  netPayrollCashAttribution,
  refundOriginalPayrollBonusCash,
  restoreOriginalPayrollCashPayment,
} from './payroll-salary-first-cash-reverse';

const SALARY = new Decimal('300000.00');
const BONUS_A = 'bonus-a';
const BONUS_B = 'bonus-b';
const CASH_320 = new Decimal('320000.00');
const REFUND_50 = new Decimal('50000.00');

function encoded320kNotes(): string {
  const allocation = allocateSalaryFirstCash({
    cash: CASH_320,
    salaryRemaining: SALARY,
    bonuses: [
      { bonusReleaseId: BONUS_A, remaining: new Decimal('20000.00') },
      { bonusReleaseId: BONUS_B, remaining: new Decimal('40000.00') },
    ],
    assignments: parsePayrollCashBonusAssignments([
      { bonusReleaseId: BONUS_A, amount: '20000.00' },
    ]),
  });
  return encodePayrollCashNotes(allocation);
}

function paid320kPayment() {
  return { id: 'pay-1', amount: CASH_320, notes: encoded320kNotes() };
}

function original320kLinks() {
  const decoded = decodePayrollCashNotes(encoded320kNotes());
  expect(decoded).not.toBeNull();
  return restoreOriginalPayrollCashPayment(decoded);
}

describe('P5-S2 reversal restores original payroll cash links', () => {
  it('restores 320000 as 300000 salary and 20000 on bonus A, leaving bonus B at 0', () => {
    const original = original320kLinks();
    const afterPayment = netPayrollCashAttribution([paid320kPayment()]);
    const afterReverse = netPayrollCashAttribution([]);

    expect(original.salaryAmount.toFixed(2)).toBe('300000.00');
    expect(original.bonusParts[0]?.bonusReleaseId).toBe(BONUS_A);
    expect(original.bonusParts[0]?.amount.toFixed(2)).toBe('20000.00');
    expect(original.bonusParts.some((part) => part.bonusReleaseId === BONUS_B)).toBe(false);

    expect(afterPayment.salaryPaid.toFixed(2)).toBe('300000.00');
    expect(afterPayment.bonusPaidById.get(BONUS_A)?.toFixed(2)).toBe('20000.00');
    expect(afterPayment.bonusPaidById.get(BONUS_B)?.toFixed(2) ?? '0.00').toBe('0.00');

    expect(afterReverse.salaryPaid.toFixed(2)).toBe('0.00');
    expect(afterReverse.bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(afterReverse.bonusPaidById.get(BONUS_B)?.toFixed(2) ?? '0.00').toBe('0.00');
  });

  it('does not restore the 320000 links a second time after the payment is already reversed', () => {
    const first = netPayrollCashAttribution([]);
    const second = netPayrollCashAttribution([]);
    const restoredEmpty = restoreOriginalPayrollCashPayment(null);

    expect(first.salaryPaid.toFixed(2)).toBe('0.00');
    expect(second.salaryPaid.toFixed(2)).toBe('0.00');
    expect(first.bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(second.bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(restoredEmpty.salaryAmount.toFixed(2)).toBe('0.00');
    expect(restoredEmpty.bonusParts).toEqual([]);
  });

  it('refunds 50000 against 20000 bonus cash without reducing 300000 salary and keeps a 30000 residual', () => {
    const refund = refundOriginalPayrollBonusCash({
      original: original320kLinks(),
      refundAmount: REFUND_50,
      sourcePaymentId: 'pay-1',
      idempotencyKey: 'refund-50',
    });
    const refundNotes = encodePayrollCashRefundNotes(refund, 'Client return uncovered residual');
    const refundRow = {
      id: 'refund-1',
      amount: new Decimal('-20000.00'),
      notes: refundNotes,
    };
    const net = netPayrollCashAttribution([paid320kPayment(), refundRow]);

    expect(refund.salaryAmount.toFixed(2)).toBe('0.00');
    expect(refund.bonusParts[0]?.bonusReleaseId).toBe(BONUS_A);
    expect(refund.bonusParts[0]?.amount.toFixed(2)).toBe('20000.00');
    expect(refund.bonusParts.some((part) => part.bonusReleaseId === BONUS_B)).toBe(false);
    expect(refund.residualAmount.toFixed(2)).toBe('30000.00');
    expect(decodePayrollCashRefundNotes(refundNotes)?.residualAmount.toFixed(2)).toBe('30000.00');

    expect(net.salaryPaid.toFixed(2)).toBe('300000.00');
    expect(net.bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(net.bonusPaidById.get(BONUS_B)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(net.residualAmount.toFixed(2)).toBe('30000.00');
    expect(payrollCashLedgerPaidAmount([paid320kPayment(), refundRow]).toFixed(2)).toBe(
      '300000.00',
    );
  });

  it('does not restore another 20000 on bonus A from a second refund of the same payment', () => {
    const refund = refundOriginalPayrollBonusCash({
      original: original320kLinks(),
      refundAmount: REFUND_50,
      sourcePaymentId: 'pay-1',
    });
    const notes = encodePayrollCashRefundNotes(refund, 'Client return uncovered residual');
    const rows = [
      paid320kPayment(),
      { id: 'refund-1', amount: new Decimal('-20000.00'), notes },
      { id: 'refund-2', amount: new Decimal('-20000.00'), notes },
    ];
    const net = netPayrollCashAttribution(rows);
    expect(net.bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(net.salaryPaid.toFixed(2)).toBe('300000.00');
    expect(net.residualAmount.toFixed(2)).toBe('30000.00');
    expect(payrollCashLedgerPaidAmount(rows).toFixed(2)).toBe('300000.00');
  });

  it('lets a later 20000 payment to bonus A make ledger paid 320000 after the refund', () => {
    const refund = refundOriginalPayrollBonusCash({
      original: original320kLinks(),
      refundAmount: REFUND_50,
      sourcePaymentId: 'pay-1',
    });
    const repay = allocateSalaryFirstCash({
      cash: new Decimal('20000.00'),
      salaryRemaining: new Decimal('0.00'),
      bonuses: [{ bonusReleaseId: BONUS_A, remaining: new Decimal('20000.00') }],
      assignments: parsePayrollCashBonusAssignments([
        { bonusReleaseId: BONUS_A, amount: '20000.00' },
      ]),
    });
    const rows = [
      paid320kPayment(),
      {
        id: 'refund-1',
        amount: new Decimal('-20000.00'),
        notes: encodePayrollCashRefundNotes(refund, 'Client return uncovered residual'),
      },
      { id: 'pay-2', amount: new Decimal('20000.00'), notes: encodePayrollCashNotes(repay) },
    ];
    expect(payrollCashLedgerPaidAmount(rows).toFixed(2)).toBe('320000.00');
    expect(netPayrollCashAttribution(rows).bonusPaidById.get(BONUS_A)?.toFixed(2)).toBe('20000.00');
    expect(netPayrollCashAttribution(rows).salaryPaid.toFixed(2)).toBe('300000.00');
  });

  it('does not keep bonus A unpaid after the source payment is deleted and 20000 is paid again', () => {
    const refund = refundOriginalPayrollBonusCash({
      original: original320kLinks(),
      refundAmount: REFUND_50,
      sourcePaymentId: 'pay-1',
    });
    const repay = allocateSalaryFirstCash({
      cash: new Decimal('20000.00'),
      salaryRemaining: new Decimal('0.00'),
      bonuses: [{ bonusReleaseId: BONUS_A, remaining: new Decimal('20000.00') }],
      assignments: parsePayrollCashBonusAssignments([
        { bonusReleaseId: BONUS_A, amount: '20000.00' },
      ]),
    });
    const leftoverRefund = {
      id: 'refund-1',
      amount: new Decimal('-20000.00'),
      notes: encodePayrollCashRefundNotes(refund, 'Client return uncovered residual'),
    };
    const repayRow = {
      id: 'pay-2',
      amount: new Decimal('20000.00'),
      notes: encodePayrollCashNotes(repay),
    };
    const afterDelete = netPayrollCashAttribution([leftoverRefund, repayRow]);
    expect(afterDelete.bonusPaidById.get(BONUS_A)?.toFixed(2)).toBe('20000.00');
    expect(afterDelete.residualAmount.toFixed(2)).toBe('30000.00');
    expect(payrollCashLedgerPaidAmount([leftoverRefund, repayRow]).toFixed(2)).toBe('20000.00');
  });
});
