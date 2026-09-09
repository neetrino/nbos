import type { Deal, DealOrder } from '@/lib/api/deals';
import {
  COMMERCIAL_DEAL_TYPES,
  HANDOFF_VISIBLE_DEAL_STATUSES,
} from '../constants/deal-handoff.constants';

export function getDealOrders(deal: Deal): DealOrder[] {
  return deal.orders ?? [];
}

export function hasEarlyStartOrder(deal: Deal): boolean {
  return getDealOrders(deal).some((order) => order.deliveryStartMode === 'EARLY_START');
}

export function hasPaidInvoice(deal: Deal): boolean {
  return getDealOrders(deal).some((order) =>
    (order.invoices ?? []).some((invoice) => invoice.moneyStatus === 'PAID'),
  );
}

export function hasDealInvoice(deal: Deal): boolean {
  return getDealOrders(deal).some((order) => (order.invoices ?? []).length > 0);
}

export function shouldShowHandoffPanel(deal: Deal): boolean {
  const handoff = deal.handoff;
  if (deal.status === 'WON') return true;
  if (hasEarlyStartOrder(deal)) return true;
  if (handoff?.project || handoff?.product || (handoff?.subscriptions?.length ?? 0) > 0) {
    return true;
  }
  if (handoff?.maintenanceDeal) return true;
  if (
    deal.type &&
    COMMERCIAL_DEAL_TYPES.has(deal.type) &&
    HANDOFF_VISIBLE_DEAL_STATUSES.has(deal.status)
  ) {
    return true;
  }
  return false;
}
