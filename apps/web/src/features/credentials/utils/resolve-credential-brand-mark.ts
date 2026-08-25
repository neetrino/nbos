import type { BrandMark } from '@/lib/it-brand-marks/brand-mark';
import { resolveItBrandMarkFromHints } from '@/lib/it-brand-marks/resolve-it-brand-mark';

const MAIL_BRAND_CATEGORIES = new Set(['MAIL']);
const MAIL_BRAND_TYPES = new Set(['MAIL_SMTP']);

export interface CredentialBrandMarkHints {
  provider?: string | null;
  url?: string | null;
  name?: string | null;
  login?: string | null;
  category?: string | null;
  credentialType?: string | null;
}

function usesLoginAsBrand(category?: string | null, credentialType?: string | null): boolean {
  return MAIL_BRAND_CATEGORIES.has(category ?? '') || MAIL_BRAND_TYPES.has(credentialType ?? '');
}

/**
 * Service identity first: provider, then URL, then name.
 * Login email is only a brand signal for Mail (not Domain/Hosting/etc.).
 */
export function resolveCredentialBrandMark(input: CredentialBrandMarkHints): BrandMark | null {
  const fromService = resolveItBrandMarkFromHints(input.provider, input.url, input.name);
  if (fromService) return fromService;
  if (!usesLoginAsBrand(input.category, input.credentialType)) return null;
  return resolveItBrandMarkFromHints(input.login);
}
