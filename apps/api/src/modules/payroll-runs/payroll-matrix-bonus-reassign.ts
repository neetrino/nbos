import { BadRequestException } from '@nestjs/common';
import { type PrismaClient, type TransactionClient } from '@nbos/database';
import { syncProductBonusPoolForOrder } from '../bonus/product-bonus-pool-sync';
import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';
import { detachBonusReleasesFromPayrollRun } from './payroll-bonus-release-detach';
import type { PayrollAttachNotifyEvent } from './payroll-attach-notify.types';

export type ReassignMatrixBonusParams = {
  payrollRunId: string;
  fromEmployeeId: string;
  orderId: string;
  toEmployeeId: string;
  reason: string;
};

export type ReassignMatrixBonusResult = {
  bonusEntryId: string;
  projectId: string;
  carryNotifyEvents: PayrollAttachNotifyEvent[];
};

export async function reassignMatrixBonusRecipient(
  tx: TransactionClient,
  params: ReassignMatrixBonusParams,
): Promise<ReassignMatrixBonusResult> {
  const reason = params.reason.trim();
  if (reason.length === 0) {
    throw new BadRequestException('reason is required when reassigning bonus recipient');
  }
  if (params.fromEmployeeId === params.toEmployeeId) {
    throw new BadRequestException('New recipient must differ from current recipient');
  }

  const entry = await tx.bonusEntry.findFirst({
    where: { employeeId: params.fromEmployeeId, orderId: params.orderId },
    select: { id: true, projectId: true, employeeId: true },
  });
  if (!entry) {
    throw new BadRequestException('No bonus entry for this employee and delivery unit');
  }

  const paidCount = await tx.bonusRelease.count({
    where: { bonusEntryId: entry.id, status: 'PAID' },
  });
  if (paidCount > 0) {
    throw new BadRequestException('Bonus recipient cannot be changed after payment');
  }

  const toLine = await tx.salaryLine.findUnique({
    where: {
      payrollRunId_employeeId: {
        payrollRunId: params.payrollRunId,
        employeeId: params.toEmployeeId,
      },
    },
    select: { id: true },
  });
  if (!toLine) {
    throw new BadRequestException(
      'New recipient has no salary line in this payroll run. Add or seed the line first.',
    );
  }

  const includedOnRun = await tx.bonusRelease.findMany({
    where: {
      bonusEntryId: entry.id,
      payrollRunId: params.payrollRunId,
      status: 'INCLUDED_IN_PAYROLL',
    },
    select: { id: true },
  });
  const includedIds = includedOnRun.map((r) => r.id);

  if (includedIds.length > 0) {
    await detachBonusReleasesFromPayrollRun(tx, {
      payrollRunId: params.payrollRunId,
      releaseIds: includedIds,
    });
  }

  await tx.bonusEntry.update({
    where: { id: entry.id },
    data: { employeeId: params.toEmployeeId },
  });

  await tx.bonusRelease.updateMany({
    where: { bonusEntryId: entry.id, status: { not: 'PAID' } },
    data: { employeeId: params.toEmployeeId },
  });

  let carryNotifyEvents: PayrollAttachNotifyEvent[] = [];
  if (includedIds.length > 0) {
    carryNotifyEvents = await attachBonusReleasesToPayrollRun(tx, {
      payrollRunId: params.payrollRunId,
      releaseIds: includedIds,
    });
  }

  return { bonusEntryId: entry.id, projectId: entry.projectId, carryNotifyEvents };
}

export async function reassignMatrixBonusRecipientAndSync(
  prisma: InstanceType<typeof PrismaClient>,
  params: ReassignMatrixBonusParams,
): Promise<ReassignMatrixBonusResult> {
  const result = await prisma.$transaction((tx) => reassignMatrixBonusRecipient(tx, params));
  await syncProductBonusPoolForOrder(prisma, params.orderId);
  return result;
}
