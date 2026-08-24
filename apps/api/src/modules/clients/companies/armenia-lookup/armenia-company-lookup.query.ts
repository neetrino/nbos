import {
  ARMENIA_TIN_LENGTH,
  SRC_LOOKUP_QUERY_MAX_LENGTH,
  SRC_LOOKUP_QUERY_MIN_LENGTH,
} from './armenia-company-lookup.constants';
import type { ArmeniaCompanyLookupQuery } from './armenia-company-lookup.types';

const TIN_ONLY_CHARS = /^[\d\s-]+$/;
const HAS_LETTER = /\p{L}/u;

export function normalizeArmeniaTin(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '');
  if (digits.length !== ARMENIA_TIN_LENGTH || !/^\d+$/.test(digits)) return null;
  return digits;
}

export function parseArmeniaCompanyLookupQuery(raw: string): ArmeniaCompanyLookupQuery | null {
  const value = raw.trim();
  if (value.length < SRC_LOOKUP_QUERY_MIN_LENGTH || value.length > SRC_LOOKUP_QUERY_MAX_LENGTH) {
    return null;
  }

  if (TIN_ONLY_CHARS.test(value)) {
    const tin = normalizeArmeniaTin(value);
    return tin ? { kind: 'tin', value: tin } : null;
  }

  if (HAS_LETTER.test(value)) return { kind: 'name', value };
  return null;
}
