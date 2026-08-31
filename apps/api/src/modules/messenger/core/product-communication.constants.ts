import type { ProductCommunicationPurpose } from '@nbos/database';

export const PRODUCT_COMMUNICATION_PURPOSE_WORK = 'WORK' satisfies ProductCommunicationPurpose;
export const PRODUCT_COMMUNICATION_PURPOSE_FINANCE =
  'FINANCE' satisfies ProductCommunicationPurpose;

export const PRODUCT_COMMUNICATION_PURPOSES = [
  PRODUCT_COMMUNICATION_PURPOSE_WORK,
  PRODUCT_COMMUNICATION_PURPOSE_FINANCE,
] as const;

export type ProductCommunicationPurposeName = (typeof PRODUCT_COMMUNICATION_PURPOSES)[number];

export const PRODUCT_COMMUNICATION_BINDING_ACTIVE = 'ACTIVE';

/** Used when WhatsAppGatewayConnection.gatewayAccountId is unset (legacy/local). */
export const WHATSAPP_FALLBACK_ACCOUNT_ID = 'default';

export const PRODUCT_COMMUNICATION_PURPOSE_ALREADY_ACTIVE =
  'Product already has an active destination for this purpose';

export const PRODUCT_COMMUNICATION_ACCOUNTANT_FORBIDDEN =
  'Official accountant WhatsApp group cannot be a Product WORK or FINANCE destination';
