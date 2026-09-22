import type { InputJsonValue, TransactionClient } from '@nbos/database';
import {
  allocateShares,
  DELIVERY_MONEY_SCALE,
  parseScaledDecimal,
  type DeliveryPlanLine,
} from '@nbos/shared';
import { computeDeliveryEncumberedFloor } from './compute-delivery-encumbered-floor';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';

type VolumeAllocation = {
  id: string;
  employeeId: string;
  sharePercent: { toString(): string };
  retainedAcceptedAmount: { toString(): string };
  bonusEntry: {
    id: string;
    bonusReleases: Array<{ amount: { toString(): string }; status: string }>;
  } | null;
};

type VolumeComponent = {
  id: string;
  componentKey: string;
  roleKey: string;
  allocations: VolumeAllocation[];
};

export async function rewriteVolumeComponents(
  db: TransactionClient,
  input: {
    configurationId: string;
    componentKeys: readonly string[];
    lines: readonly DeliveryPlanLine[];
  },
): Promise<void> {
  if (input.componentKeys.length === 0) return;
  const components = await db.deliveryBonusComponent.findMany({
    where: {
      configurationId: input.configurationId,
      componentKey: { in: [...input.componentKeys] },
    },
    include: {
      allocations: { include: { bonusEntry: { include: { bonusReleases: true } } } },
    },
  });
  const next = new Map(input.lines.map((line) => [`${line.componentKey}:${line.roleKey}`, line]));
  for (const component of components) {
    const line = next.get(`${component.componentKey}:${component.roleKey}`);
    if (line) assertWithinFloor(component, line.amount);
  }
  for (const component of components) {
    const line = next.get(`${component.componentKey}:${component.roleKey}`);
    if (line) await writeScaledComponent(db, component, line);
  }
}

function assertWithinFloor(component: VolumeComponent, amount: string): void {
  for (const share of sharesFor(component, amount)) {
    const allocation = component.allocations.find((row) => row.employeeId === share.key);
    if (!allocation) continue;
    const floor = computeDeliveryEncumberedFloor(
      allocation.bonusEntry?.bonusReleases ?? [],
      allocation.retainedAcceptedAmount,
    );
    if (moneyExceeds(floor, share.amount)) {
      throwDeliveryCompensationError('FINANCIAL_ALLOCATION_LOCKED');
    }
  }
}

async function writeScaledComponent(
  db: TransactionClient,
  component: VolumeComponent,
  line: DeliveryPlanLine,
): Promise<void> {
  await db.deliveryBonusComponent.update({
    where: { id: component.id },
    data: { unitsSnapshot: line.units, amount: line.amount },
  });
  for (const share of sharesFor(component, line.amount)) {
    const allocation = component.allocations.find((row) => row.employeeId === share.key);
    if (!allocation) continue;
    await db.deliveryBonusAllocation.update({
      where: { id: allocation.id },
      data: { currentPlannedAmount: share.amount },
    });
    if (!allocation.bonusEntry) continue;
    await db.bonusEntry.update({
      where: { id: allocation.bonusEntry.id },
      data: {
        amount: share.amount,
        payableAmount: share.amount,
        deliveryNormativeSnapshot: { units: line.units, rate: line.rate } as InputJsonValue,
      },
    });
  }
}

function sharesFor(component: VolumeComponent, amount: string) {
  return allocateShares(
    amount,
    component.allocations.map((row) => ({
      key: row.employeeId,
      percent: row.sharePercent.toString(),
    })),
  );
}

function moneyExceeds(left: string, right: string): boolean {
  return (
    parseScaledDecimal(left, DELIVERY_MONEY_SCALE).value >
    parseScaledDecimal(right, DELIVERY_MONEY_SCALE).value
  );
}
