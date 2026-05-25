import type { PrismaClient } from '@nbos/database';

import {
  notifyBonusCarryApplied,
  notifyBonusCarryDeferred,
} from '../employees/employee-wallet-notify.ops';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import type { PayrollAttachNotifyEvent } from './payroll-attach-notify.types';

/**
 * In-app wallet notifications after payroll attach (prior-month carry apply + new cap deferrals).
 */
export async function notifyPayrollCarryEventsOnAttach(
  _prisma: InstanceType<typeof PrismaClient>,
  sink: WalletInAppNotifySink | undefined,
  events: PayrollAttachNotifyEvent[],
): Promise<void> {
  for (const event of events) {
    if (event.kind === 'CARRY_APPLIED') {
      await notifyBonusCarryApplied(sink, {
        employeeId: event.employeeId,
        payrollRunId: event.payrollRunId,
        payrollMonth: event.payrollMonth,
        amountLabel: event.amount.toFixed(2),
      });
      continue;
    }
    await notifyBonusCarryDeferred(sink, {
      employeeId: event.employeeId,
      releaseId: event.releaseId,
      orderCode: event.orderCode,
      payrollMonth: event.payrollMonth,
      amountLabel: event.amount.toFixed(2),
    });
  }
}
