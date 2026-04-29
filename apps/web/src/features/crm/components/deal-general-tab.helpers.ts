import type { Deal } from '@/lib/api/deals';
import { computePartnerDealFinancePreview } from '@nbos/shared';

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
  const preview = computePartnerDealFinancePreview({
    amount,
    paymentType: deal.paymentType,
    dealSource: deal.source,
    partnerDefaultPercent: deal.sourcePartner?.defaultPercent,
  });
  const paidInvoiceTotal = getPaidInvoiceTotal(deal);

  return {
    total: preview.total,
    partnerAmount: preview.partnerAmount,
    revenue: preview.revenue,
    toReceive: preview.total - paidInvoiceTotal,
    isFromPartner: preview.isFromPartner,
    commissionPercentUsed: preview.commissionPercentUsed,
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
