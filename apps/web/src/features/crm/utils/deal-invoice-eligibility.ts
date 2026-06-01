import type { Deal } from '@/lib/api/deals';

export function canCreateDepositInvoice(deal: Deal, taxStatus: string): boolean {
  return Boolean(
    deal.amount != null &&
    Number(deal.amount) > 0 &&
    deal.paymentType &&
    deal.contact?.id &&
    deal.type &&
    taxStatus &&
    (taxStatus !== 'TAX' || deal.companyId) &&
    deal.status !== 'WON' &&
    deal.status !== 'FAILED' &&
    (deal.orders?.length ?? 0) === 0,
  );
}

export function canAddDealInvoice(deal: Deal): boolean {
  return Boolean(deal.orders?.[0] && deal.status !== 'WON' && deal.status !== 'FAILED');
}

export function canOpenDealCreateInvoiceDialog(deal: Deal, taxStatus: string): boolean {
  return canCreateDepositInvoice(deal, taxStatus) || canAddDealInvoice(deal);
}
