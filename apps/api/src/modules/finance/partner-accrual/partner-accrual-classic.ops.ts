import { Decimal } from '@nbos/database';

export function computeInboundPartnerAccrualAmount(base: Decimal, percent: Decimal): Decimal {
  return base.times(percent).dividedBy(100).toDecimalPlaces(2);
}

/** NBOS PAR-01: Classic referral delivery carrier must be DONE (product or extension order). */
export function isClassicInboundDeliveryComplete(order: {
  productId: string | null;
  extensionId: string | null;
  product: { status: string } | null;
  extension: { status: string } | null;
}): boolean {
  if (order.productId && order.product?.status === 'DONE') return true;
  if (order.extensionId && order.extension?.status === 'DONE') return true;
  return false;
}
