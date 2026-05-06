import type { BonusTypeEnum, SalesBonusSlotEnum } from '@nbos/database';

/**
 * Human-readable SALES accrual line for Employee Wallet (aligns with web Bonus Board hint).
 */
export function employeeWalletSalesAccrualHint(
  type: BonusTypeEnum,
  salesBonusSlot: SalesBonusSlotEnum | null,
  calculationSnapshot: unknown,
): string | null {
  if (type !== 'SALES') {
    return null;
  }
  const pm = readSnapshotPaymentModel(calculationSnapshot);
  const role =
    salesBonusSlot === 'SELLER' ? 'Seller' : salesBonusSlot === 'ASSISTANT' ? 'Assistant' : null;

  const kind =
    pm === 'SUBSCRIPTION_RECURRING'
      ? 'Subscription (month 2+)'
      : pm === 'SUBSCRIPTION_FIRST_MONTH'
        ? 'Subscription (1st invoice)'
        : pm === 'CLASSIC'
          ? 'Classic'
          : 'Sales';

  return role ? `${role} · ${kind}` : kind;
}

function readSnapshotPaymentModel(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return null;
  }
  const pm = (snapshot as Record<string, unknown>).paymentModel;
  return typeof pm === 'string' ? pm : null;
}
