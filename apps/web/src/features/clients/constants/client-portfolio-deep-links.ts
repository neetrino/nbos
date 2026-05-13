/**
 * Query keys for cross-module navigation from Client Portfolio (NBOS quick actions).
 * Target pages read these to open create flows with prefilled context.
 */
export const PORTFOLIO_DEEP_LINK = {
  createDeal: 'createDeal',
  contactId: 'portfolioContactId',
  createInvoice: 'createInvoice',
  projectId: 'portfolioProjectId',
  createTicket: 'createTicket',
} as const;

export function buildPortfolioNewDealHref(contactId: string): string {
  const p = new URLSearchParams();
  p.set(PORTFOLIO_DEEP_LINK.createDeal, '1');
  p.set(PORTFOLIO_DEEP_LINK.contactId, contactId);
  return `/crm/deals?${p.toString()}`;
}

export function buildPortfolioNewInvoiceHref(projectId: string): string {
  const p = new URLSearchParams();
  p.set(PORTFOLIO_DEEP_LINK.createInvoice, '1');
  p.set(PORTFOLIO_DEEP_LINK.projectId, projectId);
  return `/finance/invoices?${p.toString()}`;
}

export function buildPortfolioNewTicketHref(projectId: string): string {
  const p = new URLSearchParams();
  p.set(PORTFOLIO_DEEP_LINK.createTicket, '1');
  p.set(PORTFOLIO_DEEP_LINK.projectId, projectId);
  return `/support?${p.toString()}`;
}

export const PORTFOLIO_MESSENGER_HREF = '/messenger';
export const PORTFOLIO_DRIVE_HREF = '/drive';
