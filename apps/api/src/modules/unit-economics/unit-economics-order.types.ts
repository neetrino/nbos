import {
  CLOSED_DELIVERY_STATUSES,
  DELIVERY_BONUS_ORDER_TYPES,
} from '../payroll-runs/delivery-payable-unit.types';

/** Order types surfaced in Unit Economics (broader than payroll delivery units). */
export const UNIT_ECONOMICS_ORDER_TYPES = [
  ...DELIVERY_BONUS_ORDER_TYPES,
  'OUTSOURCE',
  'MAINTENANCE',
] as const;

export type UnitEconomicsOrderType = (typeof UNIT_ECONOMICS_ORDER_TYPES)[number];

const CLOSED_ORDER_STATUSES = new Set(['CLOSED']);

export function isUnitEconomicsOrderOpen(
  orderType: string,
  orderStatus: string,
  productStatus?: string,
  extensionStatus?: string,
): boolean {
  if (orderType === 'PRODUCT' && productStatus) {
    return !CLOSED_DELIVERY_STATUSES.includes(
      productStatus as (typeof CLOSED_DELIVERY_STATUSES)[number],
    );
  }
  if (orderType === 'EXTENSION' && extensionStatus) {
    return !CLOSED_DELIVERY_STATUSES.includes(
      extensionStatus as (typeof CLOSED_DELIVERY_STATUSES)[number],
    );
  }
  return !CLOSED_ORDER_STATUSES.has(orderStatus);
}

export function orderDisplayLabel(order: {
  code: string;
  product: { name: string } | null;
  extension: { name: string } | null;
  deal: { name: string | null; code: string; productType: string | null } | null;
}): string {
  if (order.product) return order.product.name;
  if (order.extension) return order.extension.name;
  const dealName = order.deal?.name?.trim();
  if (dealName) return dealName;
  const dealProductType = order.deal?.productType?.trim();
  if (dealProductType) return dealProductType;
  if (order.deal?.code) return order.deal.code;
  return order.code;
}

export function productGroupForOrder(order: {
  id: string;
  code: string;
  product: { id: string; name: string } | null;
  extension: { id: string; name: string; product: { id: string; name: string } } | null;
  deal: { name: string | null; code: string; productType: string | null } | null;
}): { productGroupId: string; productGroupName: string } {
  if (order.product) {
    return { productGroupId: order.product.id, productGroupName: order.product.name };
  }
  if (order.extension) {
    return {
      productGroupId: order.extension.product.id,
      productGroupName: order.extension.product.name,
    };
  }
  const label = orderDisplayLabel(order);
  return { productGroupId: order.id, productGroupName: label };
}
