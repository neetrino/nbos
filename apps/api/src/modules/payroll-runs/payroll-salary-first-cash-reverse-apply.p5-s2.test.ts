import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it } from 'vitest';

import type { MockPrisma } from '../../test-utils/mock-prisma';
import { createExpensePaymentRecord } from '../expenses/expense-payment-create';
import { deleteExpensePaymentRecord } from '../expenses/expense-payment-delete';
import { refundExpensePayrollCash } from '../expenses/expense-payment-refund';
import { fullyPaidAttributedReleaseIds } from './payroll-salary-first-cash-apply';
import { payrollCashLedgerPaidAmount } from './payroll-salary-first-cash-reverse-paid';
import { syncSalaryLinePaidFromExpenseLedger } from './payroll-salary-line-ledger-sync';
import { encodePayrollCashNotes } from './payroll-salary-first-cash-notes';
import {
  allocateSalaryFirstCash,
  parsePayrollCashBonusAssignments,
} from './payroll-salary-first-cash';
import {
  createReverseApplyFixture,
  includedRelease,
  P5_S2_BONUS_A,
  P5_S2_BONUS_B,
} from './payroll-salary-first-cash-reverse-apply.p5-s2.fixture';
import type { StoredPayment } from './payroll-salary-first-cash-reverse-apply.p5-s2.mock';
import {
  decodePayrollCashRefundNotes,
  netPayrollCashAttribution,
  PAYROLL_CASH_REVERSE_ERRORS,
} from './payroll-salary-first-cash-reverse';

const BONUS_A = P5_S2_BONUS_A;
const BONUS_B = P5_S2_BONUS_B;

describe('P5-S2 expense payment reverse and refund apply', () => {
  let prisma: MockPrisma;
  let payments: StoredPayment[];

  beforeEach(() => {
    const fixture = createReverseApplyFixture();
    prisma = fixture.prisma;
    payments = fixture.payments;
  });

  it('reversing the 320000 payment restores 300000 salary and 20000 bonus A paid', async () => {
    await deleteExpensePaymentRecord(prisma as never, 'ex-1', 'pay-1');

    expect(prisma.expensePayment.delete).toHaveBeenCalledWith({ where: { id: 'pay-1' } });
    expect(prisma.expensePayment.update).not.toHaveBeenCalled();
    const net = netPayrollCashAttribution(payments);
    expect(net.salaryPaid.toFixed(2)).toBe('0.00');
    expect(net.bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(net.bonusPaidById.get(BONUS_B)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(prisma.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: new Decimal(0),
          remainingAmount: new Decimal('400000.00'),
          status: 'APPROVED',
        }),
      }),
    );
  });

  it('does not restore the 320000 amounts again on a second reversal', async () => {
    await deleteExpensePaymentRecord(prisma as never, 'ex-1', 'pay-1');
    prisma.salaryLine.update.mockClear();
    prisma.bonusRelease.updateMany.mockClear();

    await expect(deleteExpensePaymentRecord(prisma as never, 'ex-1', 'pay-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.salaryLine.update).not.toHaveBeenCalled();
    expect(prisma.bonusRelease.updateMany).not.toHaveBeenCalled();
    expect(netPayrollCashAttribution(payments).salaryPaid.toFixed(2)).toBe('0.00');
    expect(
      netPayrollCashAttribution(payments).bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00',
    ).toBe('0.00');
  });

  it('refunds 50000 against bonus cash, leaves 30000 residual, and does not touch 300000 salary', async () => {
    const result = await refundExpensePayrollCash(prisma as never, 'ex-1', 'pay-1', {
      amount: 50000,
      paymentDate: '2026-05-02T00:00:00.000Z',
      reason: 'Client return uncovered residual',
      idempotencyKey: 'refund-50',
    });

    expect(result.salaryAmount.toFixed(2)).toBe('0.00');
    expect(result.bonusParts[0]?.amount.toFixed(2)).toBe('20000.00');
    expect(result.residualAmount.toFixed(2)).toBe('30000.00');
    expect(result.alreadyApplied).toBe(false);
    expect(prisma.expensePayment.update).not.toHaveBeenCalled();
    expect(
      decodePayrollCashRefundNotes(payments[1]?.notes ?? null)?.residualAmount.toFixed(2),
    ).toBe('30000.00');

    const net = netPayrollCashAttribution(payments);
    expect(net.salaryPaid.toFixed(2)).toBe('300000.00');
    expect(net.bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(net.bonusPaidById.get(BONUS_B)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(net.residualAmount.toFixed(2)).toBe('30000.00');
    expect(prisma.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: new Decimal('300000.00'),
        }),
      }),
    );
    expect(prisma.bonusRelease.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [BONUS_A] }, status: 'PAID' },
      data: { status: 'INCLUDED_IN_PAYROLL' },
    });
    expect(payrollCashLedgerPaidAmount(payments).toFixed(2)).toBe('300000.00');

    const again = await refundExpensePayrollCash(prisma as never, 'ex-1', 'pay-1', {
      amount: 50000,
      paymentDate: '2026-05-02T00:00:00.000Z',
      reason: 'Client return uncovered residual',
      idempotencyKey: 'refund-50-again',
    });
    expect(again.alreadyApplied).toBe(true);
    expect(prisma.expensePayment.create).toHaveBeenCalledTimes(1);
    expect(netPayrollCashAttribution(payments).salaryPaid.toFixed(2)).toBe('300000.00');
    expect(
      netPayrollCashAttribution(payments).bonusPaidById.get(BONUS_A)?.toFixed(2) ?? '0.00',
    ).toBe('0.00');
    expect(netPayrollCashAttribution(payments).residualAmount.toFixed(2)).toBe('30000.00');
    expect(payrollCashLedgerPaidAmount(payments).toFixed(2)).toBe('300000.00');
  });

  it('pays bonus A 20000 after the refund and stores paidAmount 320000', async () => {
    await refundExpensePayrollCash(prisma as never, 'ex-1', 'pay-1', {
      amount: 50000,
      paymentDate: '2026-05-02T00:00:00.000Z',
      reason: 'Client return uncovered residual',
    });
    prisma.salaryLine.update.mockClear();
    prisma.bonusRelease.updateMany.mockClear();

    await createExpensePaymentRecord(prisma as never, 'ex-1', {
      amount: 20000,
      paymentDate: '2026-05-03T00:00:00.000Z',
      bonusAssignments: [{ bonusReleaseId: BONUS_A, amount: '20000.00' }],
    });

    expect(payrollCashLedgerPaidAmount(payments).toFixed(2)).toBe('320000.00');
    expect(netPayrollCashAttribution(payments).salaryPaid.toFixed(2)).toBe('300000.00');
    expect(netPayrollCashAttribution(payments).bonusPaidById.get(BONUS_A)?.toFixed(2)).toBe(
      '20000.00',
    );
    expect(
      fullyPaidAttributedReleaseIds(
        [
          includedRelease(BONUS_A, '20000.00', 'INCLUDED_IN_PAYROLL'),
          includedRelease(BONUS_B, '40000.00', 'INCLUDED_IN_PAYROLL'),
        ],
        payments,
      ),
    ).toEqual([BONUS_A]);
    expect(prisma.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: new Decimal('320000.00'),
        }),
      }),
    );
    expect(prisma.bonusRelease.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [BONUS_A] } },
        data: { status: 'PAID' },
      }),
    );
  });

  it('does not keep bonus A unpaid after the source payment is deleted and 20000 is paid again', async () => {
    await refundExpensePayrollCash(prisma as never, 'ex-1', 'pay-1', {
      amount: 50000,
      paymentDate: '2026-05-02T00:00:00.000Z',
      reason: 'Client return uncovered residual',
    });
    await deleteExpensePaymentRecord(prisma as never, 'ex-1', 'pay-1');
    expect(decodePayrollCashRefundNotes(payments[0]?.notes ?? null)?.bonusParts).toEqual([]);
    expect(
      decodePayrollCashRefundNotes(payments[0]?.notes ?? null)?.residualAmount.toFixed(2),
    ).toBe('30000.00');

    const repay = allocateSalaryFirstCash({
      cash: new Decimal('20000.00'),
      salaryRemaining: new Decimal('0.00'),
      bonuses: [{ bonusReleaseId: BONUS_A, remaining: new Decimal('20000.00') }],
      assignments: parsePayrollCashBonusAssignments([
        { bonusReleaseId: BONUS_A, amount: '20000.00' },
      ]),
    });
    payments.push({
      id: 'pay-2',
      amount: new Decimal('20000.00'),
      notes: encodePayrollCashNotes(repay),
      paymentDate: new Date('2026-05-04T00:00:00.000Z'),
    });
    prisma.salaryLine.update.mockClear();
    prisma.bonusRelease.updateMany.mockClear();
    await syncSalaryLinePaidFromExpenseLedger(prisma as never, 'ex-1');

    expect(netPayrollCashAttribution(payments).bonusPaidById.get(BONUS_A)?.toFixed(2)).toBe(
      '20000.00',
    );
    expect(payrollCashLedgerPaidAmount(payments).toFixed(2)).toBe('20000.00');
    expect(
      fullyPaidAttributedReleaseIds(
        [includedRelease(BONUS_A, '20000.00', 'INCLUDED_IN_PAYROLL')],
        payments,
      ),
    ).toEqual([BONUS_A]);
    expect(prisma.bonusRelease.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [BONUS_A] } },
        data: { status: 'PAID' },
      }),
    );
  });

  it('does not edit a closed payroll run in place', async () => {
    prisma.salaryLine.findUnique.mockResolvedValue({
      id: 'sl-1',
      payrollRunId: 'pr-1',
      employeeId: 'emp-1',
      totalPayable: new Decimal('400000.00'),
      payrollRun: { status: 'CLOSED' },
    });

    await expect(deleteExpensePaymentRecord(prisma as never, 'ex-1', 'pay-1')).rejects.toThrow(
      PAYROLL_CASH_REVERSE_ERRORS.closedHistory,
    );
    expect(prisma.expensePayment.delete).not.toHaveBeenCalled();
    expect(prisma.salaryLine.update).not.toHaveBeenCalled();
    expect(prisma.bonusRelease.updateMany).not.toHaveBeenCalled();

    await expect(
      refundExpensePayrollCash(prisma as never, 'ex-1', 'pay-1', {
        amount: 50000,
        paymentDate: '2026-05-02T00:00:00.000Z',
        reason: 'Client return uncovered residual',
        idempotencyKey: 'refund-50',
      }),
    ).rejects.toThrow(PAYROLL_CASH_REVERSE_ERRORS.closedHistory);
    expect(prisma.expensePayment.create).not.toHaveBeenCalled();
    expect(payments).toHaveLength(1);
    expect(payments[0]?.amount.toFixed(2)).toBe('320000.00');
    expect(prisma.salaryLine.update).not.toHaveBeenCalled();
    expect(prisma.bonusRelease.updateMany).not.toHaveBeenCalled();
    expect(prisma.expensePayment.delete).not.toHaveBeenCalled();
  });

  it('rejects a refund when the run closes inside the transaction lock', async () => {
    let historyReads = 0;
    prisma.salaryLine.findUnique.mockImplementation(async () => {
      historyReads += 1;
      return {
        id: 'sl-1',
        payrollRunId: 'pr-1',
        employeeId: 'emp-1',
        totalPayable: new Decimal('400000.00'),
        payrollRun: { status: historyReads <= 1 ? 'PAYING' : 'CLOSED' },
      };
    });

    await expect(
      refundExpensePayrollCash(prisma as never, 'ex-1', 'pay-1', {
        amount: 50000,
        paymentDate: '2026-05-02T00:00:00.000Z',
        reason: 'Client return uncovered residual',
        idempotencyKey: 'refund-race-closed',
      }),
    ).rejects.toThrow(PAYROLL_CASH_REVERSE_ERRORS.closedHistory);
    expect(prisma.expensePayment.create).not.toHaveBeenCalled();
    expect(payments).toHaveLength(1);
    expect(payments[0]?.amount.toFixed(2)).toBe('320000.00');
    expect(historyReads).toBeGreaterThan(1);
  });
});
