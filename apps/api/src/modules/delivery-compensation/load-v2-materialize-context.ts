import type { PrismaClient, TransactionClient } from '@nbos/database';
import type { DeliveryCompensationRoleKey, DeliveryDesignMode } from '@nbos/shared';

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

export async function loadV2Normatives(
  db: DeliveryQueryClient,
  locked: {
    designMode: string | null;
    aiDesignerReview: boolean;
    baseProfileVersion: { roleUnits: NormativeRoleUnitRow[] } | null;
    features: Array<{
      functionId: string;
      origin: 'INCLUDED' | 'EXTRA';
      selectedPriceVersionId: string | null;
      archivedAt: Date | null;
    }>;
  },
  asOf: Date,
): Promise<LoadedPublishedNormatives | null> {
  if (!locked.baseProfileVersion || !locked.designMode) {
    return null;
  }
  const active = locked.features.filter((feature) => feature.archivedAt === null);
  return loadPublishedDeliveryNormatives({
    asOf,
    designMode: locked.designMode as DeliveryDesignMode,
    aiDesignerReview: locked.aiDesignerReview,
    baseRoleUnits: locked.baseProfileVersion.roleUnits,
    rates: await db.deliveryRoleRateVersion.findMany({ where: { status: 'PUBLISHED' } }),
    features: active.map((feature) => ({
      functionId: feature.functionId,
      origin: feature.origin,
      selectedPriceVersionId: feature.selectedPriceVersionId,
    })),
    extraPriceVersions: await db.deliveryFunctionPriceVersion.findMany({
      where: { functionId: { in: active.map((feature) => feature.functionId) } },
      include: { roleUnits: true },
    }),
  });
}
