import type { DomainConnectionMode } from '@nbos/shared';

export interface DomainOperationDomainInput {
  domainName: string;
  provider?: string | null;
  ourCost?: number | null;
  clientCharge?: number | null;
  providerAccountId?: string | null;
}

export interface StartDomainOperationBody {
  productId: string;
  connectionMode: DomainConnectionMode;
  domains: DomainOperationDomainInput[];
  registrantData?: string | null;
  dnsInstructions?: string | null;
  /** Invoice Board path: create a separate invoice per domain when the client amount is set. */
  issueInvoices?: boolean;
}

export type DomainOperationItemStatus = 'created' | 'reused' | 'failed';

export interface DomainOperationItemResult {
  domainName: string;
  status: DomainOperationItemStatus;
  serviceId?: string;
  invoiceId?: string | null;
  expenseId?: string | null;
  kind?: string;
  message?: string;
}

export interface StartDomainOperationResult {
  productId: string;
  connectionMode: DomainConnectionMode;
  items: DomainOperationItemResult[];
}

export interface DomainLegacyDnsReportRow {
  credentialId: string;
  credentialName: string;
  linkedServiceIds: string[];
  linkedProductIds: string[];
}
