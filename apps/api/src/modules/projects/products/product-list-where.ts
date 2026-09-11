import type { Prisma } from '@nbos/database';
import {
  liveMaintenanceWhere,
  openDeliveryWhere,
  TERMINAL_LEGACY_STATUSES,
} from '../project-hub-status';
import { buildProductSearchOr } from './product-search.where';

export const PRODUCT_HUB_VIEWS = ['delivery', 'maintenance', 'closed'] as const;
export type ProductHubView = (typeof PRODUCT_HUB_VIEWS)[number];

export function parseProductHubView(value?: string): ProductHubView | undefined {
  if (value === 'delivery' || value === 'maintenance' || value === 'closed') return value;
  return undefined;
}

export function parseIncludeHubView(value?: string | boolean): boolean {
  return value === true || value === 'true' || value === '1';
}

/** Attach derived `hubView` (and the live-subscription include) only for the catalog. */
export function shouldClassifyProductHubView(
  hubView?: string,
  includeHubView?: string | boolean,
): boolean {
  return parseProductHubView(hubView) != null || parseIncludeHubView(includeHubView);
}

export function isOpenDeliveryProduct(product: {
  deliveryResolution: string | null;
  status: string;
}): boolean {
  return (
    product.deliveryResolution == null &&
    !(TERMINAL_LEGACY_STATUSES as readonly string[]).includes(product.status)
  );
}

export function classifyProductHubView(input: {
  isOpenDelivery: boolean;
  hasLiveMaintenance: boolean;
}): ProductHubView {
  if (input.isOpenDelivery) return 'delivery';
  if (input.hasLiveMaintenance) return 'maintenance';
  return 'closed';
}

export function classifyProductHubViewFromRow(product: {
  deliveryResolution: string | null;
  status: string;
  subscriptions?: ReadonlyArray<unknown>;
}): ProductHubView {
  return classifyProductHubView({
    isOpenDelivery: isOpenDeliveryProduct(product),
    hasLiveMaintenance: (product.subscriptions?.length ?? 0) > 0,
  });
}

export function buildProductHubViewWhere(view: ProductHubView): Prisma.ProductWhereInput {
  if (view === 'delivery') return openDeliveryWhere();
  if (view === 'maintenance') {
    return {
      AND: [closedDeliveryWhere(), { subscriptions: { some: liveMaintenanceWhere() } }],
    };
  }
  return {
    AND: [closedDeliveryWhere(), { subscriptions: { none: liveMaintenanceWhere() } }],
  };
}

export function applyProductHubAndSearch(
  where: Prisma.ProductWhereInput,
  hubView?: string,
  search?: string,
): void {
  const parsedView = parseProductHubView(hubView);
  const hubWhere = parsedView ? buildProductHubViewWhere(parsedView) : undefined;
  const searchOr = search?.trim() ? buildProductSearchOr(search.trim()) : undefined;
  if (hubWhere && searchOr) {
    where.AND = appendAnd(where.AND, hubWhere, { OR: searchOr });
    return;
  }
  if (hubWhere) {
    where.AND = appendAnd(where.AND, hubWhere);
    return;
  }
  if (searchOr) where.OR = searchOr;
}

function closedDeliveryWhere(): Prisma.ProductWhereInput {
  return {
    OR: [{ deliveryResolution: { not: null } }, { status: { in: [...TERMINAL_LEGACY_STATUSES] } }],
  };
}

function appendAnd(
  existing: Prisma.ProductWhereInput['AND'],
  ...clauses: Prisma.ProductWhereInput[]
): Prisma.ProductWhereInput[] {
  const current = existing == null ? [] : Array.isArray(existing) ? existing : [existing];
  return [...current, ...clauses];
}
