import { BadRequestException } from '@nestjs/common';
import type { InputJsonValue, TransactionClient } from '@nbos/database';
import { assertExpectedRevision, throwConfigurationConflict } from './assert-expected-revision';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';
import { isPrismaUniqueConstraint } from './prisma-unique';
import { lockDeliveryConfigurationRow } from './lock-delivery-configuration';
import {
  reduceRemovedFeatureAllocations,
  type AcceptedAmountInput,
} from './reduce-removed-feature-allocations';

export async function applyScopeRemoveFeature(
  db: TransactionClient,
  input: {
    configurationId: string;
    featureId: string;
    expectedRevision?: number;
    reason?: string;
    acceptedAmounts?: readonly AcceptedAmountInput[];
    actorEmployeeId?: string;
  },
): Promise<void> {
  await lockDeliveryConfigurationRow(db, input.configurationId);
  const configuration = await db.deliveryConfiguration.findUnique({
    where: { id: input.configurationId },
    include: { currentRevision: true },
  });
  if (!configuration || configuration.mode !== 'V2') {
    throwDeliveryCompensationError('LEGACY_ADOPTION_REQUIRED');
  }
  assertExpectedRevision(configuration, input.expectedRevision);

  const feature = await db.deliveryConfigurationFeature.findFirst({
    where: { id: input.featureId, configurationId: input.configurationId },
    include: {
      components: {
        include: { allocations: { include: { bonusEntry: { include: { bonusReleases: true } } } } },
      },
    },
  });
  if (!feature || feature.archivedAt) {
    return;
  }
  await db.deliveryConfigurationFeature.update({
    where: { id: feature.id },
    data: { archivedAt: new Date() },
  });
  if (!configuration.initialRevisionId) {
    return;
  }
  if (!input.reason?.trim() || !input.actorEmployeeId) {
    throw new BadRequestException('reason is required');
  }
  await reduceRemovedFeatureAllocations(db, feature.components, input.acceptedAmounts ?? []);
  await writeRemoveRevision(db, {
    configurationId: configuration.id,
    sequence: (configuration.currentRevision?.sequence ?? configuration.draftVersion) + 1,
    reason: input.reason.trim(),
    actorId: input.actorEmployeeId,
    featureId: feature.id,
  });
}

async function writeRemoveRevision(
  db: TransactionClient,
  input: {
    configurationId: string;
    sequence: number;
    reason: string;
    actorId: string;
    featureId: string;
  },
): Promise<void> {
  try {
    const revision = await db.deliveryConfigurationRevision.create({
      data: {
        configurationId: input.configurationId,
        sequence: input.sequence,
        reason: input.reason,
        actorId: input.actorId,
        financialEffectiveAt: new Date(),
        scopeSnapshot: { removedFeatureId: input.featureId } as InputJsonValue,
        teamSnapshot: {} as InputJsonValue,
      },
    });
    await db.deliveryConfiguration.update({
      where: { id: input.configurationId },
      data: { currentRevisionId: revision.id },
    });
  } catch (error) {
    if (isPrismaUniqueConstraint(error)) {
      throwConfigurationConflict();
    }
    throw error;
  }
}
