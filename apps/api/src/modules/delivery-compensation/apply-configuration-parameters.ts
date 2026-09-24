import type { ProductCategoryEnum, ProductTypeEnum, TransactionClient } from '@nbos/database';
import { frozenDeliveryAxes } from '@nbos/shared';
import { assertDeliveryOpenForConfiguration } from './assert-delivery-open';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';
import { lockDeliveryConfigurationRow } from './lock-delivery-configuration';
import { findPublishedCoreId } from './match-published-core';

type ProductKindRow = { productType: ProductTypeEnum; productCategory: ProductCategoryEnum };

type ConfigurationRow = {
  id: string;
  mode: string;
  initialRevisionId: string | null;
  entityKind: 'PRODUCT' | 'EXTENSION';
  product: ProductKindRow | null;
  extension: { product: ProductKindRow | null } | null;
};

/**
 * Freezes the published core that prices a product card. Matching is by product kind only.
 * An extension has no core, so this refuses to attach the parent product's norm to it.
 *
 * Refused once the plan is materialized: changing the core after money exists is a
 * reclassification, which canon routes through a separate corrective flow.
 */
export async function applyConfigurationParameters(
  db: TransactionClient,
  input: {
    configurationId: string;
    actorEmployeeId?: string;
  },
): Promise<void> {
  await lockDeliveryConfigurationRow(db, input.configurationId);
  await assertDeliveryOpenForConfiguration(db, input.configurationId);
  const configuration = await loadConfiguration(db, input.configurationId);
  if (configuration.mode !== 'V2') {
    throwDeliveryCompensationError('LEGACY_ADOPTION_REQUIRED');
  }
  if (configuration.initialRevisionId) {
    throwDeliveryCompensationError('REDISTRIBUTION_REQUIRED');
  }
  if (configuration.entityKind === 'EXTENSION') {
    await confirmExtensionWithoutCore(db, input.configurationId, input.actorEmployeeId);
    return;
  }
  const axes = frozenDeliveryAxes();
  const profile = await findPublishedProfile(db, configuration);
  await db.deliveryConfiguration.update({
    where: { id: input.configurationId },
    data: {
      implementationBase: axes.implementationBase,
      designMode: axes.designMode,
      aiDesignerReview: axes.aiDesignerReview,
      baseProfileVersionId: profile.id,
      checkedAt: new Date(),
      checkedById: input.actorEmployeeId ?? null,
    },
  });
  await syncIncludedFeatures(db, input.configurationId, profile.includedFunctions);
}

async function loadConfiguration(
  db: TransactionClient,
  configurationId: string,
): Promise<ConfigurationRow> {
  const row = await db.deliveryConfiguration.findUnique({
    where: { id: configurationId },
    select: {
      id: true,
      mode: true,
      initialRevisionId: true,
      entityKind: true,
      product: { select: { productType: true, productCategory: true } },
      extension: { select: { product: { select: { productType: true, productCategory: true } } } },
    },
  });
  if (!row) {
    throwDeliveryCompensationError('CONFIGURATION_INCOMPLETE');
  }
  return row as ConfigurationRow;
}

/**
 * An extension has no core. Confirmation still freezes the delivery axes and
 * marks the card checked, without copying the parent product norm.
 */
export async function confirmExtensionWithoutCore(
  db: TransactionClient,
  configurationId: string,
  actorEmployeeId?: string,
): Promise<void> {
  const axes = frozenDeliveryAxes();
  await db.deliveryConfiguration.update({
    where: { id: configurationId },
    data: {
      implementationBase: axes.implementationBase,
      designMode: axes.designMode,
      aiDesignerReview: axes.aiDesignerReview,
      baseProfileVersionId: null,
      checkedAt: new Date(),
      checkedById: actorEmployeeId ?? null,
    },
  });
}

async function findPublishedProfile(
  db: TransactionClient,
  configuration: ConfigurationRow,
): Promise<{ id: string; includedFunctions: Array<{ functionId: string }> }> {
  const id = await findPublishedCoreId(db, {
    productType: configuration.product?.productType ?? null,
  });
  if (!id) {
    throwDeliveryCompensationError('NORMATIVE_NOT_CONFIGURED');
  }
  const profile = await db.deliveryBaseProfileVersion.findUnique({
    where: { id },
    select: { id: true, includedFunctions: { select: { functionId: true } } },
  });
  if (!profile) {
    throwDeliveryCompensationError('NORMATIVE_NOT_CONFIGURED');
  }
  return profile;
}

/**
 * Included-in-base functions become active selections with no extra units, so the card shows the whole
 * scope the client bought. Functions selected earlier as paid extras are left alone.
 */
async function syncIncludedFeatures(
  db: TransactionClient,
  configurationId: string,
  includedFunctions: ReadonlyArray<{ functionId: string }>,
): Promise<void> {
  const existing = await db.deliveryConfigurationFeature.findMany({
    where: { configurationId },
    select: { functionId: true, origin: true, archivedAt: true },
  });
  const known = new Set(existing.filter((row) => row.archivedAt === null).map((r) => r.functionId));
  const missing = includedFunctions
    .map((row) => row.functionId)
    .filter((functionId) => !known.has(functionId));
  if (missing.length === 0) return;
  await db.deliveryConfigurationFeature.createMany({
    data: missing.map((functionId) => ({
      configurationId,
      functionId,
      origin: 'INCLUDED' as const,
    })),
  });
}
