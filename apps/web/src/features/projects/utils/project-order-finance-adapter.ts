import type { ProjectOrder } from '@/lib/api/projects';
import type { Order } from '@/lib/api/finance';

export function projectOrderToFinanceOrder(
  order: ProjectOrder,
  project: { id: string; name: string; code: string },
): Order {
  return {
    id: order.id,
    code: order.code,
    projectId: project.id,
    type: order.type,
    paymentType: order.paymentType,
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt,
    project: { id: project.id, code: project.code, name: project.name },
    invoices: order.invoices.map((invoice) => ({
      id: invoice.id,
      code: invoice.code,
      moneyStatus: invoice.moneyStatus,
      amount: invoice.amount,
    })),
  };
}
