import type { Deal } from '@/lib/api/deals';

export const PARTNER_PERCENT = 30;

export const TAX_STATUS_OPTIONS = [
  { value: 'TAX', label: 'Tax' },
  { value: 'TAX_FREE', label: 'Tax Free' },
] as const;

export function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function toDateInputValue(value: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}

export function computeFinance(deal: Deal) {
  const amount = Number(deal.amount ?? 0);
  const isSubscription = deal.paymentType === 'SUBSCRIPTION';
  const total = isSubscription ? amount * 12 : amount;
  const partnerAmount =
    deal.source === 'PARTNER' ? Math.round(amount * (PARTNER_PERCENT / 100)) : 0;
  const paidInvoiceTotal = getPaidInvoiceTotal(deal);
  const revenue = total - partnerAmount;

  return {
    total,
    partnerAmount,
    revenue,
    toReceive: total - paidInvoiceTotal,
    isFromPartner: deal.source === 'PARTNER',
  };
}

function getPaidInvoiceTotal(deal: Deal) {
  return (deal.orders ?? []).reduce((sum, order) => {
    const orderPaid = (order.invoices ?? [])
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((invoiceSum, invoice) => invoiceSum + Number(invoice.amount), 0);

    return sum + orderPaid;
  }, 0);
}
