/** Matches Prisma `Partner.defaultPercent` default and form bounds. */
export const DEFAULT_PARTNER_DEFAULT_PERCENT = 30;
export const PARTNER_DEFAULT_PERCENT_MIN = 0;
export const PARTNER_DEFAULT_PERCENT_MAX = 100;

/** Validates raw default % input for partner forms. */
export function parsePartnerDefaultPercentInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  const n = Number.parseFloat(trimmed);
  if (Number.isNaN(n)) return null;
  if (n < PARTNER_DEFAULT_PERCENT_MIN || n > PARTNER_DEFAULT_PERCENT_MAX) return null;
  return n;
}

/** Normalizes API decimal string for controlled inputs. */
export function formatPartnerDefaultPercentForForm(value: string | number): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return '';
  return String(n);
}
