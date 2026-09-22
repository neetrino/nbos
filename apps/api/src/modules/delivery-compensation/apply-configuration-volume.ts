import { BadRequestException } from '@nestjs/common';
import type { InputJsonValue, TransactionClient } from '@nbos/database';
import {
  calculateDeliveryPlan,
  CatalogContentValidationError,
  parseConfigurationVolumeBody,
  type ConfigurationVolumeInput,
} from '@nbos/shared';
import { assertExpectedRevision } from './assert-expected-revision';
import { assertDeliveryOpenForConfiguration } from './assert-delivery-open';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';
import { lockDeliveryConfigurationRow } from './lock-delivery-configuration';
import { loadV2Normatives, MATERIALIZE_CONFIG_INCLUDE } from './load-v2-materialize-context';
import { rewriteVolumeComponents } from './rewrite-volume-components';

type VolumeFeature = {
  id: string;
  functionId: string;
  origin: string;
  archivedAt: Date | null;
};

/**
 * Stores an instance volume on the core or on extra functions.
 * A materialized plan is rewritten in the same transaction. Included-in-base lines stay unpaid.
 */
export async function applyConfigurationVolume(
  db: TransactionClient,
  input: {
    configurationId: string;
    body: unknown;
    actorEmployeeId?: string;
    expectedRevision?: number;
  },
): Promise<string | null> {
  await lockDeliveryConfigurationRow(db, input.configurationId);
  await assertDeliveryOpenForConfiguration(db, input.configurationId);
  const configuration = await db.deliveryConfiguration.findUnique({
    where: { id: input.configurationId },
    include: { currentRevision: true, features: true },
  });
  if (!configuration || configuration.mode !== 'V2') {
    throwDeliveryCompensationError('LEGACY_ADOPTION_REQUIRED');
  }
  assertExpectedRevision(configuration, input.expectedRevision);
  const parsed = readVolumeBody(input.body);
  const targets = volumeTargets(configuration, parsed);
  await storeVolume(db, configuration.id, parsed, targets);
  if (!configuration.initialRevisionId) return null;
  await rewriteMaterializedVolume(db, configuration, parsed, targets, input.actorEmployeeId);
  return configuration.orderId;
}

function readVolumeBody(body: unknown): ConfigurationVolumeInput {
  try {
    return parseConfigurationVolumeBody(body);
  } catch (error) {
    if (error instanceof CatalogContentValidationError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}

function volumeTargets(
  configuration: { entityKind: string; features: VolumeFeature[] },
  parsed: ConfigurationVolumeInput,
): VolumeFeature[] {
  if (parsed.target === 'core') {
    if (configuration.entityKind === 'EXTENSION') {
      throw new BadRequestException('An extension has no core volume.');
    }
    return [];
  }
  const active = configuration.features.filter((feature) => feature.archivedAt === null);
  if (parsed.target === 'extras') {
    return active.filter((feature) => feature.origin === 'EXTRA');
  }
  const feature = active.find((row) => row.id === parsed.featureId);
  if (!feature || feature.origin !== 'EXTRA') {
    throw new BadRequestException('Volume applies only to an added function.');
  }
  return [feature];
}

async function storeVolume(
  db: TransactionClient,
  configurationId: string,
  parsed: ConfigurationVolumeInput,
  targets: readonly VolumeFeature[],
): Promise<void> {
  if (parsed.target === 'core') {
    await db.deliveryConfiguration.update({
      where: { id: configurationId },
      data: { coreVolumeFactor: parsed.volumeFactor, coreVolumeReason: parsed.volumeReason },
    });
    return;
  }
  if (targets.length === 0) return;
  await db.deliveryConfigurationFeature.updateMany({
    where: { id: { in: targets.map((feature) => feature.id) } },
    data: { volumeFactor: parsed.volumeFactor, volumeReason: parsed.volumeReason },
  });
}

async function rewriteMaterializedVolume(
  db: TransactionClient,
  configuration: {
    id: string;
    currentRevision: { sequence: number } | null;
    draftVersion: number;
  },
  parsed: ConfigurationVolumeInput,
  targets: readonly VolumeFeature[],
  actorEmployeeId: string | undefined,
): Promise<void> {
  if (!actorEmployeeId) {
    throw new BadRequestException('reason is required');
  }
  const locked = await db.deliveryConfiguration.findUnique({
    where: { id: configuration.id },
    include: MATERIALIZE_CONFIG_INCLUDE,
  });
  if (!locked?.baseProfileVersion) return;
  const normatives = await loadV2Normatives(db, locked, new Date());
  if (!normatives) return;
  const plan = calculateDeliveryPlan(normatives);
  if (!plan.ok) throwDeliveryCompensationError(plan.errors[0] ?? 'NORMATIVE_NOT_CONFIGURED');
  const revision = await db.deliveryConfigurationRevision.create({
    data: {
      configurationId: configuration.id,
      sequence: (configuration.currentRevision?.sequence ?? configuration.draftVersion) + 1,
      reason: parsed.volumeReason ?? 'Returned to the catalog standard',
      actorId: actorEmployeeId,
      financialEffectiveAt: new Date(),
      scopeSnapshot: {
        volumeTarget: parsed.target,
        volumeFactor: parsed.volumeFactor,
        functionIds: targets.map((feature) => feature.functionId),
      } as InputJsonValue,
      teamSnapshot: {} as InputJsonValue,
    },
  });
  await rewriteVolumeComponents(db, {
    configurationId: configuration.id,
    componentKeys: componentKeys(parsed, targets),
    lines: plan.lines,
  });
  await db.deliveryConfiguration.update({
    where: { id: configuration.id },
    data: { currentRevisionId: revision.id },
  });
}

function componentKeys(
  parsed: ConfigurationVolumeInput,
  targets: readonly VolumeFeature[],
): string[] {
  if (parsed.target === 'core') return ['BASE'];
  return targets.map((feature) => `FEATURE:${feature.functionId}`);
}
