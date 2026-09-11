import type { StageGateError } from '../crm/attribution-gate';

export const INVOICE_ORDER_COMMENT_GATE_CODE = 'STAGE_GATE_VALIDATION';

export const INVOICE_ORDER_COMMENT_FIELD = 'orderComment' as const;

export const INVOICE_ORDER_COMMENTS = [
  'FIRST_PHASE',
  'INTERMEDIATE_PHASE',
  'FINAL_PHASE',
  'EXECUTION',
  'MAINTENANCE',
] as const;

export type InvoiceOrderComment = (typeof INVOICE_ORDER_COMMENTS)[number];

export const DEAL_TYPES_FOR_ORDER_COMMENT = [
  'PRODUCT',
  'EXTENSION',
  'MAINTENANCE',
  'OUTSOURCE',
] as const;

export type DealTypeForOrderComment = (typeof DEAL_TYPES_FOR_ORDER_COMMENT)[number];

const PHASE_COMMENTS = [
  'FIRST_PHASE',
  'INTERMEDIATE_PHASE',
  'FINAL_PHASE',
  'EXECUTION',
] as const satisfies readonly InvoiceOrderComment[];

export const INVOICE_ORDER_COMMENTS_BY_DEAL_TYPE: Record<
  DealTypeForOrderComment,
  readonly InvoiceOrderComment[]
> = {
  PRODUCT: PHASE_COMMENTS,
  EXTENSION: PHASE_COMMENTS,
  MAINTENANCE: ['MAINTENANCE'],
  OUTSOURCE: PHASE_COMMENTS,
};

export const INVOICE_ORDER_COMMENT_LABELS_HY: Record<InvoiceOrderComment, string> = {
  FIRST_PHASE: 'Աշխատանքների առաջին փուլի համար',
  INTERMEDIATE_PHASE: 'Աշխատանքների միջանկյալ փուլի համար',
  FINAL_PHASE: 'Աշխատանքների վերջին փուլի համար',
  EXECUTION: 'Աշխատանքների կատարման համար',
  MAINTENANCE: 'տեխսպասարկում',
};

const COMMENT_REQUIRED_TARGETS = new Set(['AWAITING_PAYMENT', 'OVERDUE', 'PAID']);
const COLLECTION_STATUSES = new Set(['AWAITING_PAYMENT', 'OVERDUE']);

export function isInvoiceOrderComment(
  value: string | null | undefined,
): value is InvoiceOrderComment {
  return value != null && (INVOICE_ORDER_COMMENTS as readonly string[]).includes(value);
}

export function getInvoiceOrderCommentOptions(
  dealType?: string | null,
): readonly InvoiceOrderComment[] {
  if (dealType && dealType in INVOICE_ORDER_COMMENTS_BY_DEAL_TYPE) {
    return INVOICE_ORDER_COMMENTS_BY_DEAL_TYPE[dealType as DealTypeForOrderComment];
  }
  return INVOICE_ORDER_COMMENTS_BY_DEAL_TYPE.PRODUCT;
}

export function resolveInvoiceOrderCommentLabelHy(
  comment: string | null | undefined,
): string | null {
  if (!isInvoiceOrderComment(comment)) return null;
  return INVOICE_ORDER_COMMENT_LABELS_HY[comment];
}

export function needsInvoiceOrderCommentGate(input: {
  orderId?: string | null;
  currentMoneyStatus: string;
  targetMoneyStatus: string;
}): boolean {
  if (!input.orderId) return false;
  if (!COMMENT_REQUIRED_TARGETS.has(input.targetMoneyStatus)) return false;
  if (input.targetMoneyStatus === 'PAID') return true;
  if (
    COLLECTION_STATUSES.has(input.currentMoneyStatus) &&
    COLLECTION_STATUSES.has(input.targetMoneyStatus)
  ) {
    return false;
  }
  return true;
}

export function getInvoiceOrderCommentGateErrors(input: {
  orderId?: string | null;
  orderComment?: string | null;
  currentMoneyStatus: string;
  targetMoneyStatus: string;
}): StageGateError[] {
  if (!needsInvoiceOrderCommentGate(input)) return [];
  if (isInvoiceOrderComment(input.orderComment)) return [];
  return [
    {
      field: INVOICE_ORDER_COMMENT_FIELD,
      message:
        'Select an accountant note before moving an order invoice to Awaiting, Overdue, or Paid.',
    },
  ];
}

export function getOfficialInvoiceOrderCommentSendErrors(input: {
  orderId?: string | null;
  orderComment?: string | null;
}): StageGateError[] {
  if (!input.orderId) return [];
  if (isInvoiceOrderComment(input.orderComment)) return [];
  return [
    {
      field: INVOICE_ORDER_COMMENT_FIELD,
      message: 'Select an accountant note before sending the official invoice request.',
    },
  ];
}
