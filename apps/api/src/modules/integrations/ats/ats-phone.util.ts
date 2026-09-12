import { normalizePhoneToWhatsAppJid } from '@nbos/shared';
import { ATS_DIAL_PREFIX } from './ats.constants';

export type AtsPhoneNormalizeResult =
  | { success: true; e164: string; digits: string }
  | { success: false; reason: 'PHONE_MISSING' | 'PHONE_INVALID' | 'PHONE_COUNTRY_UNRESOLVED' };

/**
 * Normalize ATS `clid` to CRM phone storage (`+{digits}`), reusing AM defaults
 * from shared WhatsApp phone normalization.
 */
export function normalizeAtsCallerPhone(clid: string | null | undefined): AtsPhoneNormalizeResult {
  const result = normalizePhoneToWhatsAppJid(clid);
  if (!result.success) {
    return { success: false, reason: result.reason };
  }
  return {
    success: true,
    digits: result.digits,
    e164: `+${result.digits}`,
  };
}

/**
 * ATS click-to-call `to`: `#` plus digits as stored, not rewritten to E.164.
 * `077 96 17 18` → `#077961718`. `+374 77 961718` → `#37477961718`.
 */
export function formatAtsDialNumber(raw: string): string {
  return `${ATS_DIAL_PREFIX}${raw.replace(/\D/g, '')}`;
}

/** Candidate phone strings for Lead dedupe lookups. */
export function atsPhoneLookupVariants(e164: string, digits: string): string[] {
  const variants = new Set<string>([e164, digits]);
  if (digits.startsWith('374') && digits.length === 11) {
    variants.add(`0${digits.slice(3)}`);
    variants.add(digits.slice(3));
  }
  return [...variants];
}
