/** Product / Extension order eligible for delivery-team bonus allocation in payroll. */
export type DeliveryPayableUnitDto = {
  orderId: string;
  orderCode: string;
  orderType: 'PRODUCT' | 'EXTENSION';
  projectId: string;
  projectCode: string;
  label: string;
  productId: string | null;
  extensionId: string | null;
  deliveryOpen: boolean;
  totalPlannedBonus: string;
  totalReleasedBonus: string;
  totalPaidBonus: string;
  totalRemainingBonus: string;
  availableFunding: string;
  overFundingAmount: string;
  inclusionReason: DeliveryUnitInclusionReason;
};

export type DeliveryUnitInclusionReason =
  | 'DELIVERY_OPEN'
  | 'UNPAID_BONUS'
  | 'PINNED'
  | 'IN_THIS_PAYROLL_RUN';

export const DELIVERY_BONUS_ORDER_TYPES = ['PRODUCT', 'EXTENSION'] as const;

export const CLOSED_DELIVERY_STATUSES = ['DONE', 'LOST', 'TRANSFER'] as const;
