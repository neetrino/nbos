import { BadRequestException, ConflictException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import type { DeliveryCompensationRoleKey, DeliveryRoleUnitKind } from '@nbos/shared';
import { assertExpectedRevision } from './assert-expected-revision';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';
import { loadAddedFeaturePlan } from './load-added-feature-plan';
import { lockDeliveryConfigurationRow } from './lock-delivery-configuration';
import { assertDeliveryOpenForConfiguration } from './assert-delivery-open';
import { resolveFeatureOrigin } from './resolve-feature-origin';
import { resolveFeatureTierId } from './resolve-feature-tier';
import { restoreArchivedFeature } from './restore-archived-feature';
import { writeAddedFeatureLines } from './write-added-feature-lines';

export async function applyScopeAddFeature(
  db: TransactionClient,
  input: {
    configurationId: string;
    functionId: string;
    tierId?: string | null;
    expectedRevision?: number;
    actorEmployeeId?: string;
    reason?: string;
  },
): Promise<{ createdBonusEntryIds: string[]; orderId: string }> {
  await lockDeliveryConfigurationRow(db, input.configurationId);
  await assertDeliveryOpenForConfiguration(db, input.configurationId);
  const configuration = await db.deliveryConfiguration.findUnique({
    where: { id: input.configurationId },
    include: {
      currentRevision: true,
      features: true,
      baseProfileVersion: { include: { roleUnits: true, includedFunctions: true } },
      order: { select: { id: true, projectId: true } },
      product: { select: { productType: true } },
      extension: { select: { product: { select: { productType: true } } } },
    },
  });
  if (!configuration || configuration.mode !== 'V2') {
    throwDeliveryCompensationError('LEGACY_ADOPTION_REQUIRED');
  }
  assertExpectedRevision(configuration, input.expectedRevision);
  assertPostPlanReason(configuration.initialRevisionId, input.reason);

  const active = configuration.features.find(
    (feature) => feature.functionId === input.functionId && feature.archivedAt === null,
  );
  if (active) {
    throw new ConflictException({
      statusCode: 409,
      code: 'FUNCTION_ALREADY_SELECTED',
      message: 'This function is already on the product.',
    });
  }
  const restored = await restoreArchivedFeature(db, {
    features: configuration.features,
    functionId: input.functionId,
    afterPlan: Boolean(configuration.initialRevisionId),
  });
  if (restored) {
    return { createdBonusEntryIds: [], orderId: configuration.orderId };
  }
  const tierId = resolveFeatureTierId({
    tiers: await loadFunctionTiers(db, input.functionId),
    productType: productTypeOf(configuration),
    requestedTierId: input.tierId,
  });
  return createNewFeature(db, configuration, { ...input, tierId });
}

async function createNewFeature(
  db: TransactionClient,
  configuration: {
    id: string;
    orderId: string;
    initialRevisionId: string | null;
    entityKind: 'PRODUCT' | 'EXTENSION';
    productId: string | null;
    extensionId: string | null;
    designMode: string | null;
    aiDesignerReview: boolean;
    checkedById: string | null;
    currentRevision: { sequence: number } | null;
    baseProfileVersion: {
      roleUnits: Array<{
        roleKey: DeliveryCompensationRoleKey;
        unitKind: DeliveryRoleUnitKind;
        units: { toString(): string } | null;
      }>;
      includedFunctions: Array<{ functionId: string }>;
    } | null;
    order: { id: string; projectId: string };
  },
  input: {
    configurationId: string;
    functionId: string;
    tierId: string | null;
    actorEmployeeId?: string;
    reason?: string;
  },
): Promise<{ createdBonusEntryIds: string[]; orderId: string }> {
  const includedIds = (configuration.baseProfileVersion?.includedFunctions ?? []).map(
    (row) => row.functionId,
  );
  const origin = resolveFeatureOrigin(input.functionId, includedIds);
  const feature = await db.deliveryConfigurationFeature.create({
    data: {
      configurationId: input.configurationId,
      functionId: input.functionId,
      tierId: input.tierId,
      origin,
    },
  });
  if (origin === 'INCLUDED' || !configuration.initialRevisionId) {
    return { createdBonusEntryIds: [], orderId: configuration.orderId };
  }
  if (!configuration.baseProfileVersion) {
    return { createdBonusEntryIds: [], orderId: configuration.orderId };
  }
  const planned = await loadAddedFeaturePlan(db, {
    configuration: { ...configuration, baseProfileVersion: configuration.baseProfileVersion },
    functionId: input.functionId,
    tierId: input.tierId,
  });
  const written = await writeAddedFeatureLines(db, {
    configuration,
    feature,
    lines: planned.lines,
    assignees: planned.assignees,
    actorEmployeeId: input.actorEmployeeId ?? configuration.checkedById ?? planned.assignees.PM,
    reason: input.reason?.trim() || 'SCOPE_ADD_FEATURE',
    asOf: new Date(),
  });
  return { createdBonusEntryIds: written.createdBonusEntryIds, orderId: configuration.orderId };
}

async function loadFunctionTiers(db: TransactionClient, functionId: string) {
  return db.deliveryFunctionTier.findMany({
    where: { functionId },
    select: { id: true, position: true, productTypes: { select: { productType: true } } },
    orderBy: { position: 'asc' },
  });
}

/** A gradation follows the kind of product being sold; an extension follows its parent product. */
function productTypeOf(configuration: {
  product: { productType: string } | null;
  extension: { product: { productType: string } | null } | null;
}): string | null {
  return (
    configuration.product?.productType ?? configuration.extension?.product?.productType ?? null
  );
}

function assertPostPlanReason(initialRevisionId: string | null, reason?: string): void {
  if (initialRevisionId && !reason?.trim()) {
    throw new BadRequestException('reason is required');
  }
}
