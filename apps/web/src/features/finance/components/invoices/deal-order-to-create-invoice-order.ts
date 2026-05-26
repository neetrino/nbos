import type { Order } from '@/lib/api/finance';
import type { Deal, DealOrder } from '@/lib/api/deals';

export function dealOrderToCreateInvoiceOrder(deal: Deal, order: DealOrder): Order {
  const amount = order.totalAmount ?? deal.amount ?? 0;
  const project = deal.handoff?.project ?? {
    id: order.projectId,
    code: '',
    name: 'Project',
  };

  const paidAmount = (order.invoices ?? []).reduce((sum, invoice) => {
    if (invoice.moneyStatus !== 'PAID') return sum;
    return sum + Number(invoice.amount ?? 0);
  }, 0);

  const mapped: Order = {
    id: order.id,
    code: order.code,
    projectId: order.projectId,
    type: deal.type ?? 'PRODUCT',
    paymentType: deal.paymentType ?? 'CLASSIC',
    totalAmount: String(amount),
    amount: String(amount),
    paidAmount,
    currency: 'AMD',
    status: order.status,
    createdAt: deal.createdAt,
    project,
    company: deal.company ?? null,
    contact: deal.contact
      ? {
          id: deal.contact.id,
          firstName: deal.contact.firstName,
          lastName: deal.contact.lastName,
        }
      : null,
    invoices: (order.invoices ?? []).map((invoice) => ({
      id: invoice.id,
      code: invoice.code,
      moneyStatus: invoice.moneyStatus,
      amount: String(invoice.amount ?? 0),
    })),
    _count: { invoices: order.invoices?.length ?? 0 },
  };

  return mapped;
}
