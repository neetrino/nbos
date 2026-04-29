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
    ...project.products.map((product) => ({ kind: 'PRODUCT' as const, product })),
    ...project.extensions.map((extension) => ({ kind: 'EXTENSION' as const, extension })),
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
