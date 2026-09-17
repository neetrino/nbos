import { CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS } from '../client-service-payment-stage';
import { hasInvoiceForRenewalPeriod } from '../client-services-renewal-invoice';

const OPEN_INVOICE_STATUSES = ['NEW', 'AWAITING_PAYMENT', 'OVERDUE', 'ON_HOLD'] as const;

export type DomainClassifyKind =
  | 'new_purchase'
  | 'continue_initial'
  | 'renewal'
  | 'existing_invoice'
  | 'other_product'
  | 'archived'
  | 'ambiguous';

export interface DomainClassifyInput {
  serviceId: string | null;
  domainId: string | null;
  productId: string | null;
  requestedProductId: string;
  status: string | null;
  registrationConfirmedAt: Date | null;
  invoices: ReadonlyArray<{
    id: string;
    moneyStatus: string;
    type?: string | null;
    createdAt: Date | null;
    dueDate: Date | null;
  }>;
  renewalDate: Date | null;
}

export interface DomainClassifyResult {
  kind: DomainClassifyKind;
  serviceId?: string;
  domainId?: string;
  invoiceId?: string;
}

export function classifyDomainOperation(input: DomainClassifyInput): DomainClassifyResult {
  if (!input.serviceId) {
    return { kind: 'new_purchase', domainId: input.domainId ?? undefined };
  }
  if (input.status === 'CANCELLED') {
    return {
      kind: 'archived',
      serviceId: input.serviceId,
      domainId: input.domainId ?? undefined,
    };
  }
  if (input.productId && input.productId !== input.requestedProductId) {
    return {
      kind: 'other_product',
      serviceId: input.serviceId,
      domainId: input.domainId ?? undefined,
    };
  }

  const cycleInvoice = findCycleInvoice(input);
  if (cycleInvoice) {
    return {
      kind: 'existing_invoice',
      serviceId: input.serviceId,
      domainId: input.domainId ?? undefined,
      invoiceId: cycleInvoice.id,
    };
  }

  if (!isInitialPurchaseComplete(input)) {
    return {
      kind: 'continue_initial',
      serviceId: input.serviceId,
      domainId: input.domainId ?? undefined,
    };
  }

  return {
    kind: 'renewal',
    serviceId: input.serviceId,
    domainId: input.domainId ?? undefined,
  };
}

export function isInitialPurchaseComplete(input: DomainClassifyInput): boolean {
  if (input.registrationConfirmedAt) return true;
  return input.invoices.some(
    (invoice) => invoice.moneyStatus === 'PAID' && invoice.type !== 'DEVELOPMENT',
  );
}

function findCycleInvoice(
  input: DomainClassifyInput,
): DomainClassifyInput['invoices'][number] | undefined {
  const open = input.invoices.find((invoice) =>
    (OPEN_INVOICE_STATUSES as readonly string[]).includes(invoice.moneyStatus),
  );
  if (open) return open;
  if (!input.renewalDate) return undefined;
  const covers = hasInvoiceForRenewalPeriod(
    input.invoices,
    input.renewalDate,
    CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS,
  );
  if (!covers) return undefined;
  return input.invoices.find((invoice) => invoice.moneyStatus === 'PAID');
}
