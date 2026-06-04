import type { ProductTicketRef } from '@/lib/api/products';
import type { SupportTicket } from '@/lib/api/support';

export function productTicketToSupportTicket(
  ticket: ProductTicketRef,
  project: { id: string; code: string; name: string },
  product: { id: string; name: string; status: string },
): SupportTicket {
  return {
    id: ticket.id,
    code: ticket.code,
    title: ticket.title,
    description: null,
    projectId: project.id,
    productId: product.id,
    extensionDealId: null,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    coverageDecision: null,
    billable: false,
    assignedTo: null,
    waitingState: 'NONE',
    waitingReason: null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.createdAt,
    project,
    product,
    extensionDeal: null,
    contact: null,
    assignee: null,
    technicalAsset: null,
    technicalEnvironment: null,
    resolutionSummary: null,
    closeReason: null,
    slaState: {
      state: 'ON_TRACK',
      responseDeadline: null,
      resolveDeadline: null,
      effectiveResponseDeadline: null,
      effectiveResolveDeadline: null,
      pauseActive: false,
      waitingState: 'NONE',
    },
  };
}
