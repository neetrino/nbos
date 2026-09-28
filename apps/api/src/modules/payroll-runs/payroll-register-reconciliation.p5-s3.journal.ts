import { Decimal } from '@nbos/database';
import { vi } from 'vitest';

import { expensePaymentJournalKey } from '../expenses/expense-payment-delete';
import { moneyAmount } from './payroll-allocation-source-amounts';

export type P5S3JournalLine = {
  idempotencyKey: string;
  amount: number;
  functionalAmount: number;
  status: 'ACTIVE' | 'REVERSED';
};

export type P5S3Journal = {
  lines: P5S3JournalLine[];
  appendExpensePaymentLine: ReturnType<typeof vi.fn>;
  reverseJournalLineByIdempotencyKey: ReturnType<typeof vi.fn>;
};

export function createP5S3Journal(): P5S3Journal {
  const lines: P5S3JournalLine[] = [];
  return {
    lines,
    appendExpensePaymentLine: vi.fn(async (input: { expensePaymentId: string; amount: number }) => {
      lines.push({
        idempotencyKey: expensePaymentJournalKey(input.expensePaymentId),
        amount: input.amount,
        functionalAmount: -input.amount,
        status: 'ACTIVE',
      });
    }),
    reverseJournalLineByIdempotencyKey: vi.fn(async (idempotencyKey: string) => {
      const line = lines.find((row) => row.idempotencyKey === idempotencyKey);
      if (line == null || line.status === 'REVERSED') {
        return;
      }
      line.status = 'REVERSED';
    }),
  };
}

export function activeCashJournalNet(lines: readonly P5S3JournalLine[]): Decimal {
  return lines.reduce(
    (sum, line) => {
      if (line.status !== 'ACTIVE') {
        return sum;
      }
      return moneyAmount(sum.plus(line.functionalAmount));
    },
    moneyAmount(new Decimal(0)),
  );
}
