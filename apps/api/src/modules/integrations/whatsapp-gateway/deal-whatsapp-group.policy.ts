import { DEAL_WHATSAPP_CREATE_TYPES } from './deal-whatsapp-group.types';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';
import { throwWhatsAppDomainError } from './whatsapp-gateway.errors';

export function isDealLevelWhatsAppType(dealType: string | null | undefined): boolean {
  return Boolean(dealType && DEAL_WHATSAPP_CREATE_TYPES.has(dealType));
}

export function assertDealLevelWhatsAppType(dealType: string | null): void {
  if (!isDealLevelWhatsAppType(dealType)) {
    throwWhatsAppDomainError(
      409,
      WHATSAPP_ERROR.DEAL_TYPE_NOT_ELIGIBLE,
      'Early WhatsApp group create is for PRODUCT and OUTSOURCE deals. EXTENSION and MAINTENANCE use the existing Product group.',
    );
  }
}

export function assertCanCreateDealLevelWhatsAppGroup(input: {
  dealType: string | null;
  contactId: string | null;
}): void {
  assertDealLevelWhatsAppType(input.dealType);
  if (!input.contactId) {
    throwWhatsAppDomainError(
      409,
      WHATSAPP_ERROR.DEAL_CONTACT_REQUIRED,
      'Add a primary Contact before creating a WhatsApp group.',
    );
  }
}
