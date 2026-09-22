import type { PrismaClient, TransactionClient } from '@nbos/database';
import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  type DeliveryCompensationRoleKey,
  type DeliveryDesignMode,
  type DeliveryRoleUnitInput,
} from '@nbos/shared';

export type DeliveryQueryClient = PrismaClient | TransactionClient;
import {
  loadPublishedDeliveryNormatives,
  type LoadedPublishedNormatives,
  type NormativeRoleUnitRow,
} from './load-published-delivery-normatives';
import {
  resolveExtensionRoleAssignees,
  resolveProductRoleAssignees,
} from './resolve-delivery-role-assignees';

export const MATERIALIZE_CONFIG_INCLUDE = {
  order: { select: { id: true, projectId: true } },
  features: true,
  baseProfileVersion: { include: { roleUnits: true } },
} as const;

export async function loadV2Assignees(
  db: DeliveryQueryClient,
  input: { entityKind: 'PRODUCT' | 'EXTENSION'; productId?: string; extensionId?: string },
): Promise<Partial<Record<DeliveryCompensationRoleKey, string>>> {
  if (input.entityKind === 'PRODUCT' && input.productId) {
    const product = await db.product.findUnique({
      where: { id: input.productId },
      select: {
        developerId: true,
        frontendDeveloperId: true,
        pmId: true,
        designerId: true,
        qaLeadId: true,
        technicalSpecialistId: true,
      },
    });
    return resolveProductRoleAssignees(product ?? {});
  }
  const rows = await db.extensionDeliveryRoleAssignment.findMany({
    where: { extensionId: input.extensionId },
  });
  return resolveExtensionRoleAssignees(rows);
}

type NormativeConfiguration = {
  entityKind?: 'PRODUCT' | 'EXTENSION';
  extensionId?: string | null;
  designMode: string | null;
  aiDesignerReview: boolean;
  baseProfileVersion: { roleUnits: NormativeRoleUnitRow[] } | null;
  features: Array<{
    functionId: string;
    tierId: string | null;
    origin: 'INCLUDED' | 'EXTRA';
    selectedPriceVersionId: string | null;
    archivedAt: Date | null;
  }>;
};

export async function loadV2Normatives(
  db: DeliveryQueryClient,
  locked: NormativeConfiguration,
  asOf: Date,
): Promise<LoadedPublishedNormatives | null> {
  if (!locked.baseProfileVersion && !isExtensionWithoutCore(locked)) {
    return null;
  }
  const loaded = await loadConfiguredNormatives(db, locked, asOf);
  if (!isExtensionWithoutCore(locked)) {
    return loaded;
  }
  return { ...loaded, baseRoleUnits: absentCoreUnits() };
}

function isExtensionWithoutCore(locked: NormativeConfiguration): boolean {
  if (locked.baseProfileVersion) {
    return false;
  }
  return locked.entityKind === 'EXTENSION' || Boolean(locked.extensionId);
}

function absentCoreUnits(): DeliveryRoleUnitInput[] {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => ({
    roleKey,
    unitKind: 'NOT_REQUIRED',
    units: null,
  }));
}

async function loadConfiguredNormatives(
  db: DeliveryQueryClient,
  locked: NormativeConfiguration,
  asOf: Date,
): Promise<LoadedPublishedNormatives> {
  const active = locked.features.filter((feature) => feature.archivedAt === null);
  return loadPublishedDeliveryNormatives({
    asOf,
    designMode: (locked.designMode as DeliveryDesignMode | null) ?? 'AI_DESIGN',
    aiDesignerReview: locked.aiDesignerReview,
    baseRoleUnits: locked.baseProfileVersion?.roleUnits ?? [],
    rates: await db.deliveryRoleRateVersion.findMany({ where: { status: 'PUBLISHED' } }),
    features: active.map((feature) => ({
      functionId: feature.functionId,
      origin: feature.origin,
      selectedPriceVersionId: feature.selectedPriceVersionId,
    })),
    extraPriceVersions: await loadExtraPriceVersions(db, active),
  });
}

async function loadExtraPriceVersions(
  db: DeliveryQueryClient,
  active: NormativeConfiguration['features'],
) {
  if (active.length === 0) {
    return [];
  }
  return db.deliveryFunctionPriceVersion.findMany({
    where: {
      OR: active.map((feature) => ({
        functionId: feature.functionId,
        tierId: feature.tierId,
      })),
    },
    include: { roleUnits: true },
  });
}
