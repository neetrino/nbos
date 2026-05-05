import type { BonusEntryListRow } from '@/lib/api/bonus';

function readSnapshotPaymentModel(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return null;
  }
  const pm = (snapshot as Record<string, unknown>).paymentModel;
  return typeof pm === 'string' ? pm : null;
}

/**
 * Short label for SALES accrual context (classic vs subscription tranches). Null for non-SALES.
 */
export function bonusSalesAccrualHint(row: BonusEntryListRow): string | null {
  if (row.type !== 'SALES') {
    return null;
  }
  const pm = readSnapshotPaymentModel(row.calculationSnapshot);
  const role =
    row.salesBonusSlot === 'SELLER'
      ? 'Seller'
      : row.salesBonusSlot === 'ASSISTANT'
        ? 'Assistant'
        : null;

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
