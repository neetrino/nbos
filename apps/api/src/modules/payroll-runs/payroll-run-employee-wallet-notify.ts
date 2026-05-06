import { type PrismaClient } from '@nbos/database';
import type { NotificationService } from '../notifications/notification.service';
import {
  notifyPayrollRunClosed,
  notifyPayrollRunCreated,
} from '../employees/employee-wallet-notify.ops';

/**
 * In-app wallet hints: one notification per distinct employee on the run (seed lines).
 */
export async function notifyEmployeesOnPayrollRunCreated(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  runId: string,
  payrollMonth: string,
): Promise<void> {
  const lineEmployees = await prisma.salaryLine.findMany({
    where: { payrollRunId: runId },
    select: { employeeId: true },
  });
  const seen = new Set<string>();
  for (const row of lineEmployees) {
    if (seen.has(row.employeeId)) continue;
    seen.add(row.employeeId);
    await notifyPayrollRunCreated(notifications, {
      employeeId: row.employeeId,
      payrollMonth,
      runId,
    });
  }
}

/**
 * In-app wallet hints when a payroll run is closed.
 */
export async function notifyEmployeesOnPayrollRunClosed(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  runId: string,
  payrollMonth: string,
): Promise<void> {
  const lineEmployees = await prisma.salaryLine.findMany({
    where: { payrollRunId: runId },
    select: { employeeId: true },
  });
  const seen = new Set<string>();
  for (const row of lineEmployees) {
    if (seen.has(row.employeeId)) continue;
    seen.add(row.employeeId);
    await notifyPayrollRunClosed(notifications, {
      employeeId: row.employeeId,
      payrollMonth,
      runId,
    });
  }
}
