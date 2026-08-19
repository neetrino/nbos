export function buildLeadSearchHref(id: string): string {
  return `/crm/leads?openLeadId=${encodeURIComponent(id)}`;
}

export function buildDealSearchHref(id: string): string {
  return `/crm/deals?openDealId=${encodeURIComponent(id)}`;
}

export function buildProductSearchHref(projectId: string, productId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(productId)}`;
}

export function buildInvoiceSearchHref(id: string): string {
  return `/finance/invoices?openInvoice=${encodeURIComponent(id)}`;
}

export function buildOrderSearchHref(id: string): string {
  return `/finance/orders?openOrder=${encodeURIComponent(id)}`;
}

export function buildSubscriptionSearchHref(id: string): string {
  return `/finance/subscriptions?openSubscription=${encodeURIComponent(id)}`;
}

export function buildExpenseSearchHref(id: string): string {
  return `/finance/expenses?openExpense=${encodeURIComponent(id)}`;
}

/** Payments list has no per-row sheet deep link in v1. */
export function buildPaymentSearchHref(): string {
  return '/finance/payments';
}

export function buildCredentialSearchHref(id: string): string {
  return `/credentials?openCredentialId=${encodeURIComponent(id)}`;
}
