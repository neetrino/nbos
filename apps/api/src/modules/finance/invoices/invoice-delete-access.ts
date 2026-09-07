import { ForbiddenException } from '@nestjs/common';

const INVOICE_DELETE_OWNER_ONLY =
  'Only the platform owner can delete invoices. Cancel the invoice instead.';

export function assertCanDeleteInvoice(actor: { isPlatformOwner?: boolean }): void {
  if (actor.isPlatformOwner === true) return;
  throw new ForbiddenException(INVOICE_DELETE_OWNER_ONLY);
}
