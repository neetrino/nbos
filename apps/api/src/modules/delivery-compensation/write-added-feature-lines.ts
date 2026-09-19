import type { InputJsonValue, TransactionClient } from '@nbos/database';
import {
  allocateShares,
  DELIVERY_BONUS_SOURCE_V2,
  type DeliveryCompensationRoleKey,
  type DeliveryPlanLine,
} from '@nbos/shared';
import { mapDeliveryBonusType } from './map-delivery-bonus-type';

export async function writeAddedFeatureLines(
  db: Pick<
    TransactionClient,
    | 'deliveryConfiguration'
    | 'deliveryConfigurationRevision'
    | 'deliveryBonusComponent'
    | 'deliveryBonusAllocation'
    | 'bonusEntry'
  >,
  input: {
    configuration: {
      id: string;
      orderId: string;
      order: { projectId: string };
      currentRevision: { sequence: number } | null;
    };
    feature: { id: string; functionId: string; origin: string };
    lines: readonly DeliveryPlanLine[];
    assignees: Partial<Record<DeliveryCompensationRoleKey, string>>;
    actorEmployeeId?: string | null;
    reason: string;
    asOf: Date;
  },
): Promise<{ createdBonusEntryIds: string[] }> {
  const actorId = input.actorEmployeeId;
  if (!actorId) {
    return { createdBonusEntryIds: [] };
  }
  const revision = await db.deliveryConfigurationRevision.create({
    data: {
      configurationId: input.configuration.id,
      sequence: (input.configuration.currentRevision?.sequence ?? 0) + 1,
      reason: input.reason,
      actorId,
      financialEffectiveAt: input.asOf,
      scopeSnapshot: {
        addedFunctionId: input.feature.functionId,
        origin: input.feature.origin,
      } as InputJsonValue,
      teamSnapshot: input.assignees as InputJsonValue,
    },
  });
  const createdBonusEntryIds: string[] = [];
  for (const line of input.lines) {
    const entryId = await writeAddedLine(db, input, revision.id, line);
    if (entryId) createdBonusEntryIds.push(entryId);
  }
  await db.deliveryConfiguration.update({
    where: { id: input.configuration.id },
    data: { currentRevisionId: revision.id },
  });
  return { createdBonusEntryIds };
}

async function writeAddedLine(
  db: Pick<TransactionClient, 'deliveryBonusComponent' | 'deliveryBonusAllocation' | 'bonusEntry'>,
  input: {
    configuration: { id: string; orderId: string; order: { projectId: string } };
    feature: { id: string };
    assignees: Partial<Record<DeliveryCompensationRoleKey, string>>;
  },
  revisionId: string,
  line: DeliveryPlanLine,
): Promise<string | null> {
  const employeeId = input.assignees[line.roleKey];
  if (!employeeId || Number(line.amount) <= 0) {
    return null;
  }
  const [share] = allocateShares(line.amount, [{ key: employeeId, percent: '100' }]);
  if (!share) return null;
  const component = await db.deliveryBonusComponent.create({
    data: {
      configurationId: input.configuration.id,
      featureId: input.feature.id,
      componentKey: line.componentKey,
      kind: 'FEATURE',
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
      orderId: input.configuration.orderId,
      projectId: input.configuration.order.projectId,
      type: mapDeliveryBonusType(line.roleKey),
      amount: share.amount,
      originalAmount: share.amount,
      percent: 0,
      status: 'INCOMING',
      deliverySource: DELIVERY_BONUS_SOURCE_V2,
      deliveryAllocationId: allocation.id,
      deliveryRoleKey: line.roleKey,
      deliveryConfigurationId: input.configuration.id,
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
