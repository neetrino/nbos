import type { InputJsonValue, TransactionClient } from '@nbos/database';
import {
  allocateShares,
  calculateDeliveryPlan,
  DELIVERY_BONUS_SOURCE_V2,
  type DeliveryCompensationRoleKey,
  type DeliveryPlanLine,
} from '@nbos/shared';
import type { LoadedPublishedNormatives } from './load-published-delivery-normatives';
import { mapDeliveryBonusType } from './map-delivery-bonus-type';

export type WriteInitialPlanDb = Pick<
  TransactionClient,
  | 'deliveryConfiguration'
  | 'deliveryConfigurationRevision'
  | 'deliveryBonusComponent'
  | 'deliveryBonusAllocation'
  | 'bonusEntry'
>;

export type WriteInitialPlanInput = {
  configurationId: string;
  orderId: string;
  projectId: string;
  actorEmployeeId: string;
  assignees: Partial<Record<DeliveryCompensationRoleKey, string>>;
  normatives: LoadedPublishedNormatives;
  features: Array<{ id: string; functionId: string; origin: string }>;
  asOf: Date;
};

export type WrittenInitialPlan = {
  revisionId: string;
  bonusEntryIds: string[];
};

export async function writeInitialDeliveryPlan(
  db: WriteInitialPlanDb,
  input: WriteInitialPlanInput,
): Promise<WrittenInitialPlan> {
  const plan = calculateDeliveryPlan({
    baseRoleUnits: input.normatives.baseRoleUnits,
    baseVolumeFactor: input.normatives.baseVolumeFactor,
    rates: input.normatives.rates,
    features: input.normatives.features,
  });
  const revision = await db.deliveryConfigurationRevision.create({
    data: {
      configurationId: input.configurationId,
      sequence: 1,
      reason: 'INITIAL_DEVELOPMENT',
      actorId: input.actorEmployeeId,
      financialEffectiveAt: input.asOf,
      scopeSnapshot: buildScopeSnapshot(input.features) as InputJsonValue,
      teamSnapshot: input.assignees as InputJsonValue,
    },
  });
  const bonusEntryIds: string[] = [];
  for (const line of plan.lines) {
    if (Number(line.amount) <= 0) {
      continue;
    }
    const entryId = await writePositiveLine(db, input, revision.id, line);
    if (entryId) {
      bonusEntryIds.push(entryId);
    }
  }
  await db.deliveryConfiguration.update({
    where: { id: input.configurationId },
    data: {
      initialRevisionId: revision.id,
      currentRevisionId: revision.id,
    },
  });
  return { revisionId: revision.id, bonusEntryIds };
}

async function writePositiveLine(
  db: WriteInitialPlanDb,
  input: WriteInitialPlanInput,
  revisionId: string,
  line: DeliveryPlanLine,
): Promise<string | null> {
  const employeeId = input.assignees[line.roleKey];
  if (!employeeId) {
    return null;
  }
  const [share] = allocateShares(line.amount, [{ key: employeeId, percent: '100' }]);
  if (!share || Number(share.amount) <= 0) {
    return null;
  }
  const featureId = featureIdForLine(input.features, line.componentKey);
  const component = await db.deliveryBonusComponent.create({
    data: {
      configurationId: input.configurationId,
      featureId,
      componentKey: line.componentKey,
      kind: line.componentKey === 'BASE' ? 'BASE' : 'FEATURE',
      roleKey: line.roleKey,
      unitsSnapshot: line.units,
      rateSnapshot: line.rate,
      amount: line.amount,
      originatingRevisionId: revisionId,
    },
  });
  const allocation = await db.deliveryBonusAllocation.create({
    data: {
      componentId: component.id,
      employeeId,
      sharePercent: share.percent,
      currentPlannedAmount: share.amount,
      originatingRevisionId: revisionId,
    },
  });
  const entry = await db.bonusEntry.create({
    data: {
      title: `Delivery ${line.componentKey} · ${line.roleKey}`,
      employeeId,
      orderId: input.orderId,
      projectId: input.projectId,
      type: mapDeliveryBonusType(line.roleKey),
      amount: share.amount,
      originalAmount: share.amount,
      percent: 0,
      status: 'INCOMING',
      deliverySource: DELIVERY_BONUS_SOURCE_V2,
      deliveryAllocationId: allocation.id,
      deliveryRoleKey: line.roleKey,
      deliveryConfigurationId: input.configurationId,
      deliveryComponentId: component.id,
      deliveryRevisionId: revisionId,
      deliveryNormativeSnapshot: { units: line.units, rate: line.rate } as InputJsonValue,
      kpiPayoutFactor: 1,
      payableAmount: share.amount,
      kpiGatePassed: true,
    },
  });
  return entry.id;
}

function buildScopeSnapshot(features: readonly { functionId: string; origin: string }[]) {
  return {
    functionIds: features.map((feature) => feature.functionId),
    origins: features.map((feature) => ({
      functionId: feature.functionId,
      origin: feature.origin,
    })),
  };
}

function featureIdForLine(
  features: readonly { id: string; functionId: string }[],
  componentKey: string,
): string | null {
  if (!componentKey.startsWith('FEATURE:')) {
    return null;
  }
  const functionId = componentKey.slice('FEATURE:'.length);
  return features.find((feature) => feature.functionId === functionId)?.id ?? null;
}
