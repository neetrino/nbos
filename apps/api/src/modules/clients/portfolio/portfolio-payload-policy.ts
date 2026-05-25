import type { PortfolioAccessMask } from './portfolio-access-mask';

export type ClientHealth = 'good' | 'warning' | 'risk';

export function computePortfolioClientHealth(input: {
  overdueInvoices: number;
  tickets: Array<{ status: string }>;
  mask: PortfolioAccessMask;
}): ClientHealth {
  const invoiceRisk = input.mask.finance && input.overdueInvoices > 0;
  const ticketSignal =
    input.mask.support &&
    input.tickets.some((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED');

  if (invoiceRisk) return 'risk';
  if (ticketSignal) return 'warning';
  return 'good';
}

type InvoiceRow = { amount: string | null; [key: string]: unknown };
type SubscriptionRow = { amount: string | null; [key: string]: unknown };
type DealRow = { amount: unknown; [key: string]: unknown };

function stripAmountsFromInvoices(rows: InvoiceRow[]): InvoiceRow[] {
  return rows.map((r) => ({ ...r, amount: null }));
}

function stripAmountsFromSubscriptions(rows: SubscriptionRow[]): SubscriptionRow[] {
  return rows.map((r) => ({ ...r, amount: null }));
}

function stripDealAmounts(contact: Record<string, unknown>): Record<string, unknown> {
  const deals = contact.deals as DealRow[] | undefined;
  if (!deals?.length) return contact;
  return {
    ...contact,
    deals: deals.map((d) => ({ ...d, amount: null })),
  };
}

export interface ContactPortfolioSummary {
  projectCount: number;
  companyCount: number;
  openTicketCount: number;
  paidInvoiceCount: number;
  outstandingInvoiceCount: number;
  overdueInvoiceCount: number;
  subscriptionActiveCount: number;
}

export interface CompanyPortfolioSummary {
  projectCount: number;
  openTicketCount: number;
  overdueInvoiceCount: number;
  subscriptionActiveCount: number;
  paidInvoiceCount: number;
  outstandingInvoiceCount: number;
}

export function applyMaskToContactPortfolio<
  T extends {
    accessMask: PortfolioAccessMask;
    clientHealth: ClientHealth;
    contact: Record<string, unknown>;
    subscriptions: SubscriptionRow[];
    invoices: InvoiceRow[];
    tickets: Array<{ status: string }>;
    clientServices: unknown[];
    summary: ContactPortfolioSummary;
  },
>(payload: T, ctx: { overdueInvoices: number }): T {
  const mask = payload.accessMask;
  let next: T = { ...payload };

  if (!mask.finance) {
    next = {
      ...next,
      invoices: [],
      summary: {
        ...next.summary,
        paidInvoiceCount: 0,
        outstandingInvoiceCount: 0,
        overdueInvoiceCount: 0,
      },
    };
  }

  if (!mask.subscriptions) {
    next = {
      ...next,
      subscriptions: [],
      summary: { ...next.summary, subscriptionActiveCount: 0 },
    };
  }

  if (!mask.support) {
    next = {
      ...next,
      tickets: [],
      clientServices: [],
      summary: { ...next.summary, openTicketCount: 0 },
    };
  }

  if (!mask.financeAmounts) {
    next = {
      ...next,
      invoices: stripAmountsFromInvoices(next.invoices),
      subscriptions: stripAmountsFromSubscriptions(next.subscriptions),
    };
  }

  if (!mask.finance || !mask.financeAmounts) {
    next = {
      ...next,
      contact: stripDealAmounts(next.contact),
    };
  }

  next = {
    ...next,
    clientHealth: computePortfolioClientHealth({
      overdueInvoices: mask.finance ? ctx.overdueInvoices : 0,
      tickets: next.tickets,
      mask,
    }),
  };

  return next;
}

export function applyMaskToCompanyPortfolio<
  T extends {
    accessMask: PortfolioAccessMask;
    clientHealth: ClientHealth;
    company: Record<string, unknown>;
    subscriptions: SubscriptionRow[];
    invoices: InvoiceRow[];
    tickets: Array<{ status: string }>;
    clientServices: unknown[];
    summary: CompanyPortfolioSummary;
  },
>(payload: T, ctx: { overdueInvoices: number }): T {
  const mask = payload.accessMask;
  let next: T = { ...payload };

  if (!mask.finance) {
    next = {
      ...next,
      invoices: [],
      summary: {
        ...next.summary,
        paidInvoiceCount: 0,
        outstandingInvoiceCount: 0,
        overdueInvoiceCount: 0,
      },
    };
  }

  if (!mask.subscriptions) {
    next = {
      ...next,
      subscriptions: [],
      summary: { ...next.summary, subscriptionActiveCount: 0 },
    };
  }

  if (!mask.support) {
    next = {
      ...next,
      tickets: [],
      clientServices: [],
      summary: { ...next.summary, openTicketCount: 0 },
    };
  }

  if (!mask.financeAmounts) {
    next = {
      ...next,
      invoices: stripAmountsFromInvoices(next.invoices),
      subscriptions: stripAmountsFromSubscriptions(next.subscriptions),
    };
  }

  next = {
    ...next,
    clientHealth: computePortfolioClientHealth({
      overdueInvoices: mask.finance ? ctx.overdueInvoices : 0,
      tickets: next.tickets,
      mask,
    }),
  };

  return next;
}
