import type { BlockerDirectAction } from '@/features/shared/blocker-actions';
import {
  buildProductDetailPageHref,
  PRODUCT_DETAIL_TAB,
} from '@/features/projects/constants/product-detail-tab';

/**
 * Deep link for a Product stage-gate blocker shortcut (product-centric navigation).
 */
export function resolveProductStageGateActionHref(args: {
  projectId: string;
  productId: string;
  action: Pick<BlockerDirectAction, 'key'>;
}): string {
  switch (args.action.key) {
    case 'pm-intake':
      return buildProductDetailPageHref(
        args.projectId,
        args.productId,
        PRODUCT_DETAIL_TAB.overview,
      );
    case 'product-workspace-tasks':
      return buildProductDetailPageHref(args.projectId, args.productId, PRODUCT_DETAIL_TAB.tasks);
    case 'product-support-tickets':
      return buildProductDetailPageHref(args.projectId, args.productId, PRODUCT_DETAIL_TAB.tickets);
    case 'product-extensions':
      return buildProductDetailPageHref(
        args.projectId,
        args.productId,
        PRODUCT_DETAIL_TAB.extensions,
      );
    default:
      return buildProductDetailPageHref(
        args.projectId,
        args.productId,
        PRODUCT_DETAIL_TAB.overview,
      );
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
  switch (args.action.key) {
    case 'extension-workspace-tasks':
      return buildProductDetailPageHref(args.projectId, args.productId, PRODUCT_DETAIL_TAB.tasks);
    case 'extension-intake':
      return buildProductDetailPageHref(
        args.projectId,
        args.productId,
        PRODUCT_DETAIL_TAB.extensions,
      );
    default:
      return buildProductDetailPageHref(
        args.projectId,
        args.productId,
        PRODUCT_DETAIL_TAB.extensions,
      );
  }
}
