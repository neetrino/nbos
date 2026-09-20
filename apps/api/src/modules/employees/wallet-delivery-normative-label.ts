import { DELIVERY_BONUS_SOURCE_V2 } from '@nbos/shared';

export type WalletDeliveryLabel = {
  deliveryRoleKey: string | null;
};

const EMPTY_LABEL: WalletDeliveryLabel = { deliveryRoleKey: null };

/**
 * Role shown next to a delivery accrual in the employee's own wallet. Only V2 delivery rows
 * carry a role; legacy and sales rows stay unlabelled. Units and rates are deliberately absent:
 * canon keeps them out of the employee API, including their own wallet.
 */
export function walletDeliveryLabel(entry: {
  deliverySource: string | null;
  deliveryRoleKey: string | null;
}): WalletDeliveryLabel {
  if (entry.deliverySource !== DELIVERY_BONUS_SOURCE_V2) {
    return EMPTY_LABEL;
  }
  return { deliveryRoleKey: entry.deliveryRoleKey ?? null };
}
