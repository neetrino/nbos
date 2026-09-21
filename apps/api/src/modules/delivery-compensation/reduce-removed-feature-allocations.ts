import { BadRequestException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import { parseScaledDecimal, DELIVERY_MONEY_SCALE } from '@nbos/shared';
import { computeDeliveryEncumberedFloor } from './compute-delivery-encumbered-floor';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';

export type AcceptedAmountInput = {
  allocationId: string;
  acceptedAmount: string;
};

type FeatureComponent = {
  allocations: Array<{
    id: string;
    retainedAcceptedAmount: { toString(): string };
    currentPlannedAmount: { toString(): string };
    bonusEntry: {
      id: string;
      bonusReleases: Array<{ amount: { toString(): string }; status: string }>;
    } | null;
  }>;
};

export async function reduceRemovedFeatureAllocations(
  db: TransactionClient,
  components: FeatureComponent[],
  acceptedAmounts: readonly AcceptedAmountInput[],
): Promise<void> {
  const acceptedById = new Map(
    acceptedAmounts.map((row) => [row.allocationId, row.acceptedAmount.trim()]),
  );
  for (const component of components) {
    for (const allocation of component.allocations) {
      const acceptedRaw = acceptedById.get(allocation.id);
      if (acceptedRaw === undefined || acceptedRaw === '') {
        throw new BadRequestException('acceptedAmounts must cover every allocation');
      }
      const accepted = parseAcceptedAmount(acceptedRaw);
      const encumbered = computeDeliveryEncumberedFloor(
        allocation.bonusEntry?.bonusReleases ?? [],
        allocation.retainedAcceptedAmount,
      );
      const floor = Number(accepted) > Number(encumbered) ? accepted : encumbered;
      if (Number(floor) > Number(allocation.currentPlannedAmount.toString())) {
        throwDeliveryCompensationError('FINANCIAL_ALLOCATION_LOCKED');
      }
      await db.deliveryBonusAllocation.update({
        where: { id: allocation.id },
        data: { currentPlannedAmount: floor, retainedAcceptedAmount: accepted },
      });
      if (allocation.bonusEntry) {
        await db.bonusEntry.update({
          where: { id: allocation.bonusEntry.id },
          data: { amount: floor, payableAmount: floor, percent: 0 },
        });
      }
    }
  }
}

function parseAcceptedAmount(raw: string): string {
  try {
    const parsed = parseScaledDecimal(raw, DELIVERY_MONEY_SCALE);
    if (parsed.value < 0n) {
      throw new BadRequestException('acceptedAmount must be greater than or equal to 0');
    }
    return raw;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException('acceptedAmount is invalid');
  }
}
