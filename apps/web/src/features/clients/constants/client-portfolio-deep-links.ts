import {
  PORTFOLIO_CLIENT_COMPANY_QUERY,
  PORTFOLIO_CLIENT_CONTACT_QUERY,
} from '@/features/messenger-client/client-messenger.constants';

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

export function buildPortfolioClientMessengerHref(input: {
  variant: 'contact' | 'company';
  entityId: string;
}): string {
  const params = new URLSearchParams();
  const key =
    input.variant === 'contact' ? PORTFOLIO_CLIENT_CONTACT_QUERY : PORTFOLIO_CLIENT_COMPANY_QUERY;
  params.set(key, input.entityId);
  return `/client-messenger?${params.toString()}`;
}

export const PORTFOLIO_DRIVE_HREF = '/drive';
