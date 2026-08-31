/** Nested order shape for invoice list/detail — includes linked deal title when present. */
export const INVOICE_ORDER_SELECT = {
  id: true,
  code: true,
  deal: { select: { id: true, name: true, code: true, type: true } },
  project: { select: { id: true, name: true } },
} as const;

export const INVOICE_ORDER_DETAIL_INCLUDE = {
  project: true,
  deal: { select: { id: true, name: true, code: true, type: true } },
} as const;

/** Enough for invoice sheet source badge (Domain / Hosting / …). */
export const INVOICE_CLIENT_SERVICE_SELECT = {
  id: true,
  type: true,
} as const;
