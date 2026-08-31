export type InvoiceDisplayDealSource = {
  name?: string | null;
  code: string;
};

export type InvoiceDisplayOrderSource = {
  code: string;
  deal?: InvoiceDisplayDealSource | null;
};

export type InvoiceDisplaySubscriptionSource = {
  name?: string | null;
  code: string;
};

export type InvoiceDisplayTitleSource = {
  code: string;
  order?: InvoiceDisplayOrderSource | null;
  subscription?: InvoiceDisplaySubscriptionSource | null;
};

/** Order label — deal name when present, otherwise order code. */
export function resolveOrderDisplayTitle(order: InvoiceDisplayOrderSource): string {
  if (order.deal) {
    return order.deal.name?.trim() || order.deal.code;
  }
  return order.code;
}

/**
 * Live invoice title: deal/order → subscription name → invoice code.
 * Not stored on Invoice.
 */
export function resolveInvoiceDisplayTitle(invoice: InvoiceDisplayTitleSource): string {
  if (invoice.order) {
    return resolveOrderDisplayTitle(invoice.order);
  }
  if (invoice.subscription) {
    return invoice.subscription.name?.trim() || invoice.subscription.code;
  }
  return invoice.code;
}

/** Invoice code when it is not already the primary title. */
export function resolveInvoiceDisplaySubtitle(
  invoice: InvoiceDisplayTitleSource,
): string | undefined {
  const title = resolveInvoiceDisplayTitle(invoice);
  return title !== invoice.code ? invoice.code : undefined;
}
