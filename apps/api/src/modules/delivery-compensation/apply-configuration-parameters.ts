import type { ProductCategoryEnum, ProductTypeEnum, TransactionClient } from '@nbos/database';
import type { ConfigurationParametersInput } from '@nbos/shared';
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
 * Confirms the parameters of a configuration and freezes the published base profile that prices its
 * core. Without this step a card has no core, so nothing can be planned from it.
 *
 * Refused once the plan is materialized: changing the size, the design mode or the implementation base
 * after money exists is a reclassification, which canon routes through a separate corrective flow
 * rather than a silent repricing of the whole plan.
 */
export async function applyConfigurationParameters(
  db: TransactionClient,
  input: {
    configurationId: string;
    parameters: ConfigurationParametersInput;
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
  const profile = await findPublishedProfile(db, configuration, input.parameters);
  await db.deliveryConfiguration.update({
    where: { id: input.configurationId },
    data: {
      implementationBase: input.parameters.implementationBase,
      designMode: input.parameters.designMode,
      aiDesignerReview: input.parameters.aiDesignerReview,
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
 * A profile is matched on the kind of product and the confirmed parameters. A profile that names no
 * product type or category is a wildcard for that field, which is how a rare combination is covered
 * without publishing the full cartesian set.
 */
async function findPublishedProfile(
  db: TransactionClient,
  configuration: ConfigurationRow,
  parameters: ConfigurationParametersInput,
): Promise<{ id: string; includedFunctions: Array<{ functionId: string }> }> {
  const product = configuration.product ?? configuration.extension?.product ?? null;
  const id = await findPublishedCoreId(db, {
    entityKind: configuration.entityKind,
    productType: product?.productType ?? null,
    productCategory: product?.productCategory ?? null,
    implementationBase: parameters.implementationBase,
    designMode: parameters.designMode,
    aiDesignerReview: parameters.aiDesignerReview,
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
