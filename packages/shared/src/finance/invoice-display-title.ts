export type InvoiceDisplayDealSource = {
  name?: string | null;
  code: string;
};

export type InvoiceDisplayNamedSource = {
  name?: string | null;
};

export type InvoiceDisplayOrderSource = {
  code: string;
  deal?: InvoiceDisplayDealSource | null;
  product?: InvoiceDisplayNamedSource | null;
  extension?: InvoiceDisplayNamedSource | null;
};

export type InvoiceDisplaySubscriptionSource = {
  name?: string | null;
  code: string;
};

export type InvoiceDisplayClientServiceSource = {
  name?: string | null;
  product?: InvoiceDisplayNamedSource | null;
};

export type InvoiceDisplayTitleSource = {
  code: string;
  order?: InvoiceDisplayOrderSource | null;
  subscription?: InvoiceDisplaySubscriptionSource | null;
  clientServiceRecord?: InvoiceDisplayClientServiceSource | null;
  product?: InvoiceDisplayNamedSource | null;
};

function firstTrimmedName(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Order label — deal name, then product/extension name, else order code. */
export function resolveOrderDisplayTitle(order: InvoiceDisplayOrderSource): string {
  return (
    firstTrimmedName(order.deal?.name, order.product?.name, order.extension?.name) ?? order.code
  );
}

/**
 * Live invoice title: deal → subscription → client service → product → code.
 * Not stored on Invoice. Codes are last-resort titles only.
 */
export function resolveInvoiceDisplayTitle(invoice: InvoiceDisplayTitleSource): string {
  return (
    firstTrimmedName(invoice.order?.deal?.name) ??
    firstTrimmedName(invoice.subscription?.name) ??
    firstTrimmedName(invoice.clientServiceRecord?.name) ??
    firstTrimmedName(
      invoice.product?.name,
      invoice.clientServiceRecord?.product?.name,
      invoice.order?.product?.name,
      invoice.order?.extension?.name,
    ) ??
    firstTrimmedName(invoice.subscription?.code) ??
    (invoice.order ? resolveOrderDisplayTitle(invoice.order) : invoice.code)
  );
}

/** Invoice code when it is not already the primary title. */
export function resolveInvoiceDisplaySubtitle(
  invoice: InvoiceDisplayTitleSource,
): string | undefined {
  const title = resolveInvoiceDisplayTitle(invoice);
  return title !== invoice.code ? invoice.code : undefined;
}
