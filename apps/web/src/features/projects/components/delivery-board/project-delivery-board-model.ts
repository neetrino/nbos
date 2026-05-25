import type {
  DeliveryLifecycleProjection,
  FullProject,
  ProjectExtensionSummary,
  ProjectProductSummary,
} from '@/lib/api/projects';

export const ACTIVE_DELIVERY_STAGES: Array<Exclude<DeliveryLifecycleProjection['stage'], null>> = [
  'STARTING',
  'DEVELOPMENT',
  'QA',
  'TRANSFER',
];

export const DELIVERY_STAGE_LABELS: Record<
  Exclude<DeliveryLifecycleProjection['stage'], null>,
  string
> = {
  STARTING: 'Starting',
  DEVELOPMENT: 'Development',
  QA: 'QA',
  TRANSFER: 'Transfer',
};

export const NEXT_DELIVERY_STAGE: Partial<
  Record<
    Exclude<DeliveryLifecycleProjection['stage'], null>,
    Exclude<DeliveryLifecycleProjection['stage'], null>
  >
> = {
  STARTING: 'DEVELOPMENT',
  DEVELOPMENT: 'QA',
  QA: 'TRANSFER',
};

export type DeliveryBoardKindFilter = 'ALL' | 'PRODUCT' | 'EXTENSION';
export type DeliveryBoardStatusFilter = 'ACTIVE' | 'ON_HOLD' | 'CLOSED' | 'ALL';

export type DeliveryBoardItem =
  | { kind: 'PRODUCT'; product: ProjectProductSummary }
  | { kind: 'EXTENSION'; extension: ProjectExtensionSummary };

export function getBoardItems(project: FullProject): DeliveryBoardItem[] {
  return [
    ...project.products.map((product) => ({
      kind: 'PRODUCT' as const,
      product: {
        ...product,
        projectId: project.id,
        project: { id: project.id, name: project.name, code: project.code },
      },
    })),
    ...project.extensions.map((extension) => ({
      kind: 'EXTENSION' as const,
      extension: {
        ...extension,
        projectId: project.id,
        project: { id: project.id, name: project.name, code: project.code },
      },
    })),
  ];
}

export function getItemLifecycle(item: DeliveryBoardItem) {
  return item.kind === 'PRODUCT'
    ? item.product.deliveryLifecycle
    : item.extension.deliveryLifecycle;
}

export function getItemKey(item: DeliveryBoardItem) {
  return item.kind === 'PRODUCT' ? `product-${item.product.id}` : `extension-${item.extension.id}`;
}

export function getNavigableProductId(item: DeliveryBoardItem) {
  return item.kind === 'PRODUCT' ? item.product.id : item.extension.productId;
}

export function getItemId(item: DeliveryBoardItem) {
  return item.kind === 'PRODUCT' ? item.product.id : item.extension.id;
}

export function getItemLabel(item: DeliveryBoardItem) {
  return item.kind === 'PRODUCT' ? item.product.name : item.extension.name;
}

export function getProjectId(item: DeliveryBoardItem): string {
  if (item.kind === 'PRODUCT') {
    return item.product.projectId ?? '';
  }
  return item.extension.projectId ?? '';
}

/** Whole-board aggregates for header badges when a scope filter locks column data. */
export function countDeliveryAggregates(items: DeliveryBoardItem[]) {
  let active = 0;
  let closed = 0;
  for (const item of items) {
    const lc = getItemLifecycle(item);
    if (!lc) continue;
    if (lc.isTerminal) closed += 1;
    else if (lc.isActive && lc.stage) active += 1;
  }
  return { active, closed };
}

export function filterBoardItems(
  items: DeliveryBoardItem[],
  kindFilter: DeliveryBoardKindFilter,
  statusFilter: DeliveryBoardStatusFilter,
) {
  return items.filter((item) => {
    if (kindFilter !== 'ALL' && item.kind !== kindFilter) return false;
    const lifecycle = getItemLifecycle(item);
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CLOSED') return Boolean(lifecycle?.isTerminal);
    if (statusFilter === 'ON_HOLD') return lifecycle?.workStatus === 'ON_HOLD';
    return Boolean(lifecycle?.isActive);
  });
}

export function getActiveBoardItems(items: DeliveryBoardItem[]) {
  return items.filter((item) => {
    const lifecycle = getItemLifecycle(item);
    return lifecycle?.isActive && lifecycle.stage !== null;
  });
}

export function getClosedBoardItems(items: DeliveryBoardItem[]) {
  return items.filter((item) => getItemLifecycle(item)?.isTerminal);
}
