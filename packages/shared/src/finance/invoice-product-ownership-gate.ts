export const INVOICE_PRODUCT_GATE_FIELD = 'product' as const;
export const INVOICE_NOTES_GATE_FIELD = 'notes' as const;

export const INVOICE_MANUAL_NOTES_REQUIRED_MESSAGE =
  'Fill in Description before sending a manual invoice to the accountant.';

export const INVOICE_CREATE_PRODUCT_REQUIRED_MESSAGE =
  'A product is required to create this invoice.';

const MANUAL_PRODUCT_REQUIRED_STATUSES = new Set(['AWAITING_PAYMENT', 'OVERDUE', 'PAID']);

/** Issued cards freeze payer/product: collection, paid, or official request already sent. */
export function isInvoicePayerContextLocked(input: {
  moneyStatus: string;
  officialInvoiceRequestSent?: boolean;
}): boolean {
  if (input.officialInvoiceRequestSent) return true;
  return MANUAL_PRODUCT_REQUIRED_STATUSES.has(input.moneyStatus);
}

export function getInvoiceManualProductGateErrors(input: {
  type: string;
  productId?: string | null;
  targetMoneyStatus: string;
}): Array<{ field: string; message: string }> {
  if (input.type !== 'MANUAL') return [];
  if (!MANUAL_PRODUCT_REQUIRED_STATUSES.has(input.targetMoneyStatus)) return [];
  if (input.productId) return [];
  return [
    {
      field: INVOICE_PRODUCT_GATE_FIELD,
      message: 'Link a product on the invoice card before awaiting payment.',
    },
  ];
}

export function getInvoiceManualNotesGateErrors(input: {
  type: string;
  notes?: string | null;
  targetMoneyStatus: string;
}): Array<{ field: string; message: string }> {
  if (!manualNotesRequired(input.type, input.notes)) return [];
  if (!MANUAL_PRODUCT_REQUIRED_STATUSES.has(input.targetMoneyStatus)) return [];
  return [{ field: INVOICE_NOTES_GATE_FIELD, message: INVOICE_MANUAL_NOTES_REQUIRED_MESSAGE }];
}

export function getOfficialInvoiceManualNotesSendErrors(input: {
  type?: string | null;
  notes?: string | null;
}): Array<{ field: string; message: string }> {
  if (!manualNotesRequired(input.type, input.notes)) return [];
  return [{ field: INVOICE_NOTES_GATE_FIELD, message: INVOICE_MANUAL_NOTES_REQUIRED_MESSAGE }];
}

function manualNotesRequired(type?: string | null, notes?: string | null): boolean {
  return type === 'MANUAL' && invoiceNotesPlainText(notes).length === 0;
}

/** Plain text of a Description field, including stored editor HTML. */
export function invoiceNotesPlainText(value?: string | null): string {
  return decodeInvoiceNoteEntities(stripInvoiceNoteTags(value ?? ''))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

function stripInvoiceNoteTags(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '');
}

/** One decode pass. Ampersand is last so `&amp;lt;` stays `&lt;`. */
function decodeInvoiceNoteEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Unsourced (manual) create requires an explicit product. Source ids inherit ownership. */
export function isUnsourcedInvoiceCreateMissingProduct(input: {
  productId?: string | null;
  orderId?: string | null;
  subscriptionId?: string | null;
  clientServiceRecordId?: string | null;
}): boolean {
  if (input.orderId?.trim()) return false;
  if (input.subscriptionId?.trim()) return false;
  if (input.clientServiceRecordId?.trim()) return false;
  return !input.productId?.trim();
}
