import { BadRequestException } from '@nestjs/common';
import type { InputJsonValue, TransactionClient } from '@nbos/database';
import { type DeliveryCompensationRoleKey, validateRedistributionPair } from '@nbos/shared';
import { assertExpectedRevision, throwConfigurationConflict } from './assert-expected-revision';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';
import { isPrismaUniqueConstraint } from './prisma-unique';
import { lockDeliveryConfigurationRow } from './lock-delivery-configuration';
import { splitReplacementComponent } from './split-replacement-component';
import { syncReplacementAssignee } from './sync-replacement-assignee';

export type ReplacementShareInput = {
  componentId: string;
  outgoingPercent: string;
  incomingPercent: string;
};

export async function applyEmployeeReplacement(
  db: TransactionClient,
  input: {
    configurationId: string;
    roleKey: DeliveryCompensationRoleKey;
    fromEmployeeId: string;
    toEmployeeId: string;
    shares: readonly ReplacementShareInput[];
    reason: string;
    actorEmployeeId: string;
    expectedRevision?: number;
  },
): Promise<{ orderId: string }> {
  if (!input.reason.trim()) {
    throw new BadRequestException('reason is required');
  }
  if (input.fromEmployeeId === input.toEmployeeId) {
    throw new BadRequestException('Replacement target must be a different employee');
  }
  await lockDeliveryConfigurationRow(db, input.configurationId);
  const configuration = await db.deliveryConfiguration.findUnique({
    where: { id: input.configurationId },
    include: {
      currentRevision: true,
      components: {
        where: { roleKey: input.roleKey },
        include: {
          allocations: { include: { bonusEntry: { include: { bonusReleases: true } } } },
        },
      },
      order: { select: { id: true, projectId: true } },
    },
  });
  if (!configuration || configuration.mode !== 'V2' || !configuration.initialRevisionId) {
    throwDeliveryCompensationError('LEGACY_ADOPTION_REQUIRED');
  }
  assertExpectedRevision(configuration, input.expectedRevision);
  assertSharesCoverComponents(configuration.components, input.shares);
  const revision = await createReplacementRevision(db, configuration, input);
  for (const share of input.shares) {
    await splitReplacementComponent(db, {
      configuration,
      component: requireComponent(configuration.components, share.componentId),
      share,
      fromEmployeeId: input.fromEmployeeId,
      toEmployeeId: input.toEmployeeId,
      revisionId: revision.id,
    });
  }
  await db.deliveryConfiguration.update({
    where: { id: configuration.id },
    data: { currentRevisionId: revision.id },
  });
  await syncReplacementAssignee(db, {
    productId: configuration.productId,
    extensionId: configuration.extensionId,
    roleKey: input.roleKey,
    toEmployeeId: input.toEmployeeId,
  });
  return { orderId: configuration.orderId };
}

function assertSharesCoverComponents(
  components: Array<{ id: string }>,
  shares: readonly ReplacementShareInput[],
): void {
  const byId = new Map(shares.map((share) => [share.componentId, share]));
  if (byId.size !== components.length) {
    throwDeliveryCompensationError('REDISTRIBUTION_REQUIRED');
  }
  for (const component of components) {
    const share = byId.get(component.id);
    if (!share) {
      throwDeliveryCompensationError('REDISTRIBUTION_REQUIRED');
    }
    const error = validateRedistributionPair(share);
    if (error === 'REDISTRIBUTION_REQUIRED') {
      throwDeliveryCompensationError('REDISTRIBUTION_REQUIRED');
    }
    if (error) {
      throw new BadRequestException({ code: error, message: 'Share percents must sum to 100.' });
    }
  }
}

async function createReplacementRevision(
  db: TransactionClient,
  configuration: { id: string; currentRevision: { sequence: number } | null },
  input: {
    reason: string;
    actorEmployeeId: string;
    roleKey: DeliveryCompensationRoleKey;
    fromEmployeeId: string;
    toEmployeeId: string;
  },
) {
  try {
    return await db.deliveryConfigurationRevision.create({
      data: {
        configurationId: configuration.id,
        sequence: (configuration.currentRevision?.sequence ?? 0) + 1,
        reason: input.reason.trim(),
        actorId: input.actorEmployeeId,
        financialEffectiveAt: new Date(),
        scopeSnapshot: { replacementRole: input.roleKey } as InputJsonValue,
        teamSnapshot: {
          fromEmployeeId: input.fromEmployeeId,
          toEmployeeId: input.toEmployeeId,
        } as InputJsonValue,
      },
    });
  } catch (error) {
    if (isPrismaUniqueConstraint(error)) {
      throwConfigurationConflict();
    }
    throw error;
  }
}

function requireComponent<T extends { id: string }>(
  components: readonly T[],
  componentId: string,
): T {
  const component = components.find((row) => row.id === componentId);
  if (!component) {
    throwDeliveryCompensationError('REDISTRIBUTION_REQUIRED');
  }
  return component;
}
