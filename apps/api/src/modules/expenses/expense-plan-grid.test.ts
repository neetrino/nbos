import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { buildExpensePlanGridPayload } from './expense-plan-grid';

const NOW = new Date('2026-04-15T12:00:00.000Z');

describe('buildExpensePlanGridPayload', () => {
  it('marks scheduled future month as FORECAST and past without card as DUE', () => {
    const payload = buildExpensePlanGridPayload(
      [
        {
          id: 'plan-1',
          name: 'Rent',
          amount: new Decimal(1000),
          frequency: 'MONTHLY',
          nextDueDate: new Date('2026-04-01T00:00:00.000Z'),
          project: null,
          expenses: [],
        },
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[2].kind).toBe('DUE');
    expect(payload.rows[0].months[8].kind).toBe('FORECAST');
  });

  it('maps linked expense to PAID when fully paid', () => {
    const payload = buildExpensePlanGridPayload(
      [
        {
          id: 'plan-1',
          name: 'SaaS',
          amount: 50,
          frequency: 'MONTHLY',
          nextDueDate: new Date('2026-04-01T00:00:00.000Z'),
          project: null,
          expenses: [
            {
              id: 'exp-1',
              amount: new Decimal(50),
              dueDate: new Date('2026-04-10T00:00:00.000Z'),
              status: 'PAID',
              expensePayments: [{ amount: new Decimal(50) }],
            },
          ],
        },
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[3].kind).toBe('PAID');
    expect(payload.rows[0].months[3].expenseId).toBe('exp-1');
  });
});
