import { PERMISSION_DENIED_MESSAGE } from '@/lib/api-errors';

export const DEAL_INVOICE_FIELDS_REQUIRED_MESSAGE =
  'Fill required: Cost, Payment Type, Contact, Deal Type, Tax Status; if Tax then Company';

export function dealInvoiceCreateDeniedMessage(
  canAddInvoice: boolean,
  eligible: boolean,
): string | null {
  if (!canAddInvoice) return PERMISSION_DENIED_MESSAGE;
  if (!eligible) return DEAL_INVOICE_FIELDS_REQUIRED_MESSAGE;
  return null;
}
