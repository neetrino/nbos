import type { PrismaClient } from '@nbos/database';

import type { NotificationService } from '../notifications/notification.service';
import { notifyPayrollCarryEventsOnAttach } from './payroll-bonus-carry-notify';
import type { PayrollBonusAllocationMaterializeResult } from './payroll-bonus-allocation-materialize';
import { notifyEmployeesOnPayrollRunClosed } from './payroll-run-employee-wallet-notify';
import {
  refreshBonusEntryStatusesForReleases,
  syncProductBonusPoolsForBonusReleases,
} from './payroll-run-bonus-release-side-effects';

type StatusSideEffectDb = InstanceType<typeof PrismaClient>;

/** Wallet and pool updates that must run only after the status transaction commits. */
export async function publishPayrollStatusSideEffects(
  prisma: StatusSideEffectDb,
  notifications: NotificationService,
  params: {
    payrollRunId: string;
    payrollMonth: string;
    nextStatus: string;
    bonus?: PayrollBonusAllocationMaterializeResult;
  },
): Promise<void> {
  if (params.bonus != null) {
    await refreshBonusEntryStatusesForReleases(prisma, params.bonus.releaseIds);
    await syncProductBonusPoolsForBonusReleases(prisma, params.bonus.releaseIds, notifications);
    await notifyPayrollCarryEventsOnAttach(prisma, notifications, params.bonus.carryNotifyEvents);
  }
  if (params.nextStatus === 'CLOSED') {
    await notifyEmployeesOnPayrollRunClosed(
      prisma,
      notifications,
      params.payrollRunId,
      params.payrollMonth,
    );
  }
}
