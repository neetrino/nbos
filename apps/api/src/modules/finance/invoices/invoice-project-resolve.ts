interface InvoiceProjectSource {
  project?: { id: string; name: string } | null;
  order?: { project?: { id: string; name: string } | null } | null;
  subscription?: { project?: { id: string; name: string } | null } | null;
}

/** Prefer direct invoice project, then order/subscription context. */
export function resolveInvoiceProjectRow(invoice: InvoiceProjectSource) {
  return invoice.project ?? invoice.order?.project ?? invoice.subscription?.project ?? null;
}
