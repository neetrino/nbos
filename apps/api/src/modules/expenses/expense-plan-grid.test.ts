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

  it('keeps issued months on the card amount after the plan rate changes', () => {
    const payload = buildExpensePlanGridPayload(
      [
        {
          id: 'plan-1',
          name: 'Hosting',
          amount: new Decimal(20000),
          frequency: 'MONTHLY',
          nextDueDate: new Date('2026-04-01T00:00:00.000Z'),
          project: null,
          expenses: [
            {
              id: 'exp-mar',
              amount: new Decimal(15000),
              dueDate: new Date('2026-03-10T00:00:00.000Z'),
              status: 'PAID',
              expensePayments: [{ amount: new Decimal(15000) }],
            },
          ],
        },
      ],
      2026,
      NOW,
    );

    expect(payload.rows[0].months[2].kind).toBe('PAID');
    expect(payload.rows[0].months[2].amount).toBe(15000);
    expect(payload.rows[0].months[8].kind).toBe('FORECAST');
    expect(payload.rows[0].months[8].amount).toBe(20000);
    expect(payload.monthTotals[2]).toBe(15000);
    expect(payload.monthTotals[8]).toBe(20000);
  });

  it('paints a later card-amount edit on the issued month only', () => {
    const payload = buildExpensePlanGridPayload(
      [
        {
          id: 'plan-1',
          name: 'SaaS',
          amount: new Decimal(50),
          frequency: 'MONTHLY',
          nextDueDate: new Date('2026-05-01T00:00:00.000Z'),
          project: null,
          expenses: [
            {
              id: 'exp-apr',
              amount: new Decimal(80),
              dueDate: new Date('2026-04-10T00:00:00.000Z'),
              status: 'PLANNED',
              expensePayments: [],
            },
          ],
        },
      ],
      2026,
      NOW,
    );

    expect(payload.rows[0].months[3].kind).toBe('OPEN');
    expect(payload.rows[0].months[3].amount).toBe(80);
    expect(payload.rows[0].months[4].kind).toBe('FORECAST');
    expect(payload.rows[0].months[4].amount).toBe(50);
  });
});
