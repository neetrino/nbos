import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import { WALLET_NOTIFY_TYPES } from '../employees/employee-wallet-notify.constants';
import { notifyPayrollCarryEventsOnAttach } from './payroll-bonus-carry-notify';

describe('notifyPayrollCarryEventsOnAttach', () => {
  it('creates in-app notifications for carry apply and defer', async () => {
    const create = vi.fn().mockResolvedValue({});
    const sink = { create };

    await notifyPayrollCarryEventsOnAttach({} as never, sink, [
      {
        kind: 'CARRY_APPLIED',
        employeeId: 'e1',
        payrollRunId: 'run1',
        payrollMonth: '2026-05',
        amount: new Decimal(25),
      },
      {
        kind: 'CARRY_DEFERRED',
        employeeId: 'e1',
        releaseId: 'rel1',
        orderCode: 'ORD-9',
        payrollMonth: '2026-05',
        amount: new Decimal(30),
      },
    ]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0]?.[0]?.type).toBe(WALLET_NOTIFY_TYPES.BONUS_CARRY_APPLIED);
    expect(create.mock.calls[1]?.[0]?.type).toBe(WALLET_NOTIFY_TYPES.BONUS_CARRY_DEFERRED);
  });
});
