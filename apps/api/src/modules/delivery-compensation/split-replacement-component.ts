import { BadRequestException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import { allocateShares, percentOfAmount, type DeliveryCompensationRoleKey } from '@nbos/shared';
import type { ReplacementShareInput } from './apply-employee-replacement';
import { computeDeliveryEncumberedFloor } from './compute-delivery-encumbered-floor';
import { createIncomingReplacementAllocation } from './create-incoming-replacement-allocation';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';

type ReplacementComponent = {
  id: string;
  roleKey: DeliveryCompensationRoleKey;
  amount: { toString(): string };
  unitsSnapshot: { toString(): string };
  rateSnapshot: { toString(): string };
  allocations: Array<{
    id: string;
    employeeId: string;
    retainedAcceptedAmount: { toString(): string };
    currentPlannedAmount: { toString(): string };
    bonusEntry: {
      id: string;
      bonusReleases: Array<{ amount: { toString(): string }; status: string }>;
    } | null;
  }>;
};

export async function splitReplacementComponent(
  db: TransactionClient,
  input: {
    configuration: { id: string; orderId: string; order: { projectId: string } };
    component: ReplacementComponent;
    share: ReplacementShareInput;
    fromEmployeeId: string;
    toEmployeeId: string;
    revisionId: string;
  },
): Promise<void> {
  const outgoing = input.component.allocations.find(
    (row) => row.employeeId === input.fromEmployeeId,
  );
  if (!outgoing) {
    throwDeliveryCompensationError('ROLE_ASSIGNMENT_REQUIRED');
  }
  const remainder = outgoing.currentPlannedAmount.toString();
  const allocated = allocateShares(remainder, [
    { key: input.fromEmployeeId, percent: input.share.outgoingPercent },
    { key: input.toEmployeeId, percent: input.share.incomingPercent },
  ]);
  const kept = allocated.find((row) => row.key === input.fromEmployeeId);
  const incoming = allocated.find((row) => row.key === input.toEmployeeId);
  if (!kept || !incoming) {
    throw new BadRequestException('Share allocation failed');
  }
  const floor = computeDeliveryEncumberedFloor(
    outgoing.bonusEntry?.bonusReleases ?? [],
    outgoing.retainedAcceptedAmount,
  );
  if (Number(kept.amount) < Number(floor)) {
    throwDeliveryCompensationError('FINANCIAL_ALLOCATION_LOCKED');
  }
  await db.deliveryBonusAllocation.update({
    where: { id: outgoing.id },
    data: {
      sharePercent: percentOfAmount(kept.amount, input.component.amount.toString()),
      currentPlannedAmount: kept.amount,
    },
  });
  if (outgoing.bonusEntry) {
    await db.bonusEntry.update({
      where: { id: outgoing.bonusEntry.id },
      data: { amount: kept.amount, payableAmount: kept.amount, percent: 0 },
    });
  }
  if (Number(incoming.amount) <= 0) {
    return;
  }
  await createIncomingReplacementAllocation(db, {
    configuration: input.configuration,
    component: input.component,
    toEmployeeId: input.toEmployeeId,
    incoming,
    revisionId: input.revisionId,
  });
}
