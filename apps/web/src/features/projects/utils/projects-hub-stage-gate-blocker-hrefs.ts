import type { BlockerDirectAction } from '@/features/shared/blocker-actions';

const PRODUCT_TAB = {
  overview: 'overview',
  tasks: 'tasks',
  extensions: 'extensions',
  tickets: 'tickets',
} as const;

/**
 * Deep link for a Product stage-gate blocker shortcut (product-centric navigation).
 */
export function resolveProductStageGateActionHref(args: {
  projectId: string;
  productId: string;
  action: Pick<BlockerDirectAction, 'key'>;
}): string {
  const base = `/projects/${args.projectId}/products/${args.productId}`;
  switch (args.action.key) {
    case 'pm-intake':
      return `${base}?tab=${PRODUCT_TAB.overview}`;
    case 'product-workspace-tasks':
      return `${base}?tab=${PRODUCT_TAB.tasks}`;
    case 'product-support-tickets':
      return `${base}?tab=${PRODUCT_TAB.tickets}`;
    case 'product-extensions':
      return `${base}?tab=${PRODUCT_TAB.extensions}`;
    default:
      return `${base}?tab=${PRODUCT_TAB.overview}`;
  }
}

/**
 * Deep link for an Extension readiness / stage-gate blocker (parent product context).
 */
export function resolveExtensionStageGateActionHref(args: {
  projectId: string;
  productId: string;
  action: Pick<BlockerDirectAction, 'key'>;
}): string {
  const base = `/projects/${args.projectId}/products/${args.productId}`;
  switch (args.action.key) {
    case 'extension-workspace-tasks':
      return `${base}?tab=${PRODUCT_TAB.tasks}`;
    case 'extension-intake':
      return `${base}?tab=${PRODUCT_TAB.extensions}`;
    default:
      return `${base}?tab=${PRODUCT_TAB.extensions}`;
  }
}
