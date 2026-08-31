export type WhatsAppPhoneDefaultCountry = 'AM';

export type WhatsAppPhoneNormalizationReason =
  | 'PHONE_MISSING'
  | 'PHONE_INVALID'
  | 'PHONE_COUNTRY_UNRESOLVED';

export type WhatsAppPhoneNormalizationResult =
  | {
      success: true;
      digits: string;
      jid: `${string}@c.us`;
    }
  | {
      success: false;
      reason: WhatsAppPhoneNormalizationReason;
    };

const DEFAULT_COUNTRY: WhatsAppPhoneDefaultCountry = 'AM';
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;
const ARMENIA_COUNTRY_CODE = '374';
const ARMENIA_NATIONAL_LENGTH = 8;

/**
 * Normalize Employee/Contact phone strings to WhatsApp direct-chat JIDs (`digits@c.us`).
 * Default country is Armenia (AM) for local `0…` and bare national numbers.
 * Explicit international numbers (leading `+` or known non-AM country codes) are preserved.
 */
export function normalizePhoneToWhatsAppJid(
  input: string | null | undefined,
  options?: { defaultCountry?: WhatsAppPhoneDefaultCountry },
): WhatsAppPhoneNormalizationResult {
  const defaultCountry = options?.defaultCountry ?? DEFAULT_COUNTRY;

  if (input == null) {
    return { success: false, reason: 'PHONE_MISSING' };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, reason: 'PHONE_MISSING' };
  }

  const alreadyJid = trimmed.match(/^(\d+)@c\.us$/i);
  if (alreadyJid?.[1]) {
    return toSuccess(alreadyJid[1]);
  }

  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  if (!digitsOnly) {
    return { success: false, reason: 'PHONE_INVALID' };
  }

  let digits = digitsOnly;

  if (hasPlus) {
    return toSuccess(digits);
  }

  if (defaultCountry === 'AM') {
    if (digits.startsWith('0') && digits.length === ARMENIA_NATIONAL_LENGTH + 1) {
      digits = `${ARMENIA_COUNTRY_CODE}${digits.slice(1)}`;
      return toSuccess(digits);
    }

    if (!digits.startsWith(ARMENIA_COUNTRY_CODE) && digits.length === ARMENIA_NATIONAL_LENGTH) {
      digits = `${ARMENIA_COUNTRY_CODE}${digits}`;
      return toSuccess(digits);
    }

    if (digits.startsWith(ARMENIA_COUNTRY_CODE)) {
      return toSuccess(digits);
    }

    // Explicit international without +: 10–15 digits not matching AM national shapes.
    if (digits.length >= 10 && digits.length <= MAX_DIGITS) {
      return toSuccess(digits);
    }

    if (digits.length < MIN_DIGITS) {
      return { success: false, reason: 'PHONE_INVALID' };
    }

    return { success: false, reason: 'PHONE_COUNTRY_UNRESOLVED' };
  }

  return { success: false, reason: 'PHONE_COUNTRY_UNRESOLVED' };
}

function toSuccess(digits: string): WhatsAppPhoneNormalizationResult {
  if (!/^\d+$/.test(digits) || digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    return { success: false, reason: 'PHONE_INVALID' };
  }
  return {
    success: true,
    digits,
    jid: `${digits}@c.us`,
  };
}

/** Stable create-group business dedupe key (also used as Gateway Idempotency-Key). */
export function buildProductWhatsAppCreateDedupeKey(productId: string): string {
  return `whatsapp-product-group:create:${productId}`;
}

/** Deal-level create key — must not use productId (Product may not exist yet). */
export function buildDealWhatsAppCreateDedupeKey(dealId: string): string {
  return `whatsapp-deal-group:create:${dealId}`;
}

export function buildProductWhatsAppParticipantDedupeKey(
  productId: string,
  employeeId: string,
): string {
  return `whatsapp-product-group:${productId}:participant:${employeeId}`;
}

export function buildProductWhatsAppClientInviteDedupeKey(
  productId: string,
  contactId: string,
  groupChatId: string,
): string {
  return `whatsapp-product-group:${productId}:client-invite:${contactId}:${groupChatId}`;
}

/** BullMQ jobId-safe encoding of a business dedupe key. */
export function toBullMqSafeJobId(businessKey: string): string {
  return businessKey.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 128);
}

const WHATSAPP_GROUP_NAME_MAX = 100;

export function buildProductWhatsAppGroupName(projectName: string, productName: string): string {
  return truncateWhatsAppGroupName(
    `${sanitizeNamePart(projectName)} · ${sanitizeNamePart(productName)}`,
    'Product',
  );
}

/** Auto name for a pre-Won Deal client group. Optional parts are omitted. */
export function buildDealWhatsAppGroupName(input: {
  dealCode: string;
  contactName?: string | null;
  dealName?: string | null;
}): string {
  const parts = [sanitizeNamePart(input.dealCode)];
  const contact = sanitizeNamePart(input.contactName ?? '');
  const dealName = sanitizeNamePart(input.dealName ?? '');
  if (contact) parts.push(contact);
  if (dealName) parts.push(dealName);
  return truncateWhatsAppGroupName(parts.join(' · '), input.dealCode.trim() || 'Deal');
}

function sanitizeNamePart(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateWhatsAppGroupName(combined: string, fallback: string): string {
  const trimmed = combined.replace(/\s·\s$/u, '').trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= WHATSAPP_GROUP_NAME_MAX) return trimmed;
  return `${trimmed.slice(0, WHATSAPP_GROUP_NAME_MAX - 1)}…`;
}
