import { api } from '../api';

export type ClientHealth = 'good' | 'warning' | 'risk';

export interface PortfolioAccessMask {
  finance: boolean;
  subscriptions: boolean;
  support: boolean;
  communication: boolean;
  files: boolean;
}

export interface ContactPortfolioResponse {
  scope: 'contact';
  accessMask: PortfolioAccessMask;
  clientHealth: ClientHealth;
  contact: Record<string, unknown>;
  subscriptions: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  tickets: Array<Record<string, unknown>>;
  clientServices: Array<Record<string, unknown>>;
  summary: {
    projectCount: number;
    companyCount: number;
    openTicketCount: number;
    paidInvoiceCount: number;
    outstandingInvoiceCount: number;
    overdueInvoiceCount: number;
    subscriptionActiveCount: number;
  };
}

export interface CompanyPortfolioResponse {
  scope: 'company';
  accessMask: PortfolioAccessMask;
  clientHealth: ClientHealth;
  company: Record<string, unknown>;
  subscriptions: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  tickets: Array<Record<string, unknown>>;
  clientServices: Array<Record<string, unknown>>;
  summary: {
    projectCount: number;
    openTicketCount: number;
    overdueInvoiceCount: number;
    subscriptionActiveCount: number;
    paidInvoiceCount: number;
    outstandingInvoiceCount: number;
  };
}

export const portfolioApi = {
  async getByContact(contactId: string): Promise<ContactPortfolioResponse> {
    const resp = await api.get<ContactPortfolioResponse>(
      `/api/clients/portfolio/contact/${contactId}`,
    );
    return resp.data;
  },
  async getByCompany(companyId: string): Promise<CompanyPortfolioResponse> {
    const resp = await api.get<CompanyPortfolioResponse>(
      `/api/clients/portfolio/company/${companyId}`,
    );
    return resp.data;
  },
};
