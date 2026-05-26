/** Nested order shape for invoice list/detail — includes linked deal title when present. */
export const INVOICE_ORDER_SELECT = {
  id: true,
  code: true,
  deal: { select: { id: true, name: true, code: true } },
  project: { select: { id: true, name: true } },
} as const;

export const INVOICE_ORDER_DETAIL_INCLUDE = {
  project: true,
  deal: { select: { id: true, name: true, code: true } },
} as const;
