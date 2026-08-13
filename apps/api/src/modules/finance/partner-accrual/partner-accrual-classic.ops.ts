import { Decimal } from '@nbos/database';

export function computeInboundPartnerAccrualAmount(base: Decimal, percent: Decimal): Decimal {
  return base.times(percent).dividedBy(100).toDecimalPlaces(2);
}

export type InboundDeliveryCarrierOrder = {
  productId: string | null;
  extensionId: string | null;
  product: { status: string } | null;
  extension: { status: string } | null;
};

/** NBOS: inbound referral delivery carrier must be DONE (linked product or extension). */
export function isInboundDeliveryComplete(order: InboundDeliveryCarrierOrder): boolean {
  if (order.productId && order.product?.status === 'DONE') return true;
  if (order.extensionId && order.extension?.status === 'DONE') return true;
  return false;
}
