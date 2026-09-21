import type { InputJsonValue, TransactionClient } from '@nbos/database';
import {
  DELIVERY_BONUS_SOURCE_V2,
  percentOfAmount,
  sumMoney,
  type DeliveryCompensationRoleKey,
  type ShareAllocation,
} from '@nbos/shared';
import { mapDeliveryBonusType } from './map-delivery-bonus-type';

export async function createIncomingReplacementAllocation(
  db: Pick<TransactionClient, 'deliveryBonusAllocation' | 'bonusEntry'>,
  input: {
    configuration: { id: string; orderId: string; order: { projectId: string } };
    component: {
      id: string;
      roleKey: DeliveryCompensationRoleKey;
      amount: { toString(): string };
      unitsSnapshot: { toString(): string };
      rateSnapshot: { toString(): string };
    };
    toEmployeeId: string;
    incoming: ShareAllocation;
    revisionId: string;
  },
): Promise<void> {
  const existing = await db.deliveryBonusAllocation.findFirst({
    where: { componentId: input.component.id, employeeId: input.toEmployeeId },
    include: { bonusEntry: true },
  });
  if (existing) {
    await addToExistingIncoming(db, existing, input);
    return;
  }
  const allocation = await db.deliveryBonusAllocation.create({
    data: {
      componentId: input.component.id,
      employeeId: input.toEmployeeId,
      sharePercent: percentOfAmount(input.incoming.amount, input.component.amount.toString()),
      currentPlannedAmount: input.incoming.amount,
      originatingRevisionId: input.revisionId,
    },
  });
  await db.bonusEntry.create({
    data: {
      title: `Delivery ${input.component.roleKey}`,
      employeeId: input.toEmployeeId,
      orderId: input.configuration.orderId,
      projectId: input.configuration.order.projectId,
      type: mapDeliveryBonusType(input.component.roleKey),
      amount: input.incoming.amount,
      originalAmount: input.incoming.amount,
      percent: 0,
      status: 'INCOMING',
      deliverySource: DELIVERY_BONUS_SOURCE_V2,
      deliveryAllocationId: allocation.id,
      deliveryRoleKey: input.component.roleKey,
      deliveryConfigurationId: input.configuration.id,
      deliveryComponentId: input.component.id,
      deliveryRevisionId: input.revisionId,
      deliveryNormativeSnapshot: {
        units: input.component.unitsSnapshot.toString(),
        rate: input.component.rateSnapshot.toString(),
      } as InputJsonValue,
      kpiPayoutFactor: 1,
      payableAmount: input.incoming.amount,
      kpiGatePassed: true,
    },
  });
}

async function addToExistingIncoming(
  db: Pick<TransactionClient, 'deliveryBonusAllocation' | 'bonusEntry'>,
  existing: {
    id: string;
    currentPlannedAmount: { toString(): string };
    bonusEntry: { id: string } | null;
  },
  input: {
    component: { amount: { toString(): string } };
    incoming: ShareAllocation;
  },
): Promise<void> {
  const nextAmount = sumMoney([existing.currentPlannedAmount.toString(), input.incoming.amount]);
  await db.deliveryBonusAllocation.update({
    where: { id: existing.id },
    data: {
      currentPlannedAmount: nextAmount,
      sharePercent: percentOfAmount(nextAmount, input.component.amount.toString()),
    },
  });
  if (existing.bonusEntry) {
    await db.bonusEntry.update({
      where: { id: existing.bonusEntry.id },
      data: { amount: nextAmount, payableAmount: nextAmount, percent: 0 },
    });
  }
}
