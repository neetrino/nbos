const ARMENIA_COUNTRY_DIGITS = '374';
const ARMENIA_NATIONAL_LENGTH = 8;

/**
 * ATS.am / office handset lookup uses `#0XXXXXXXX` for Armenian numbers.
 * Keep the original E.164 value for WhatsApp and Google search.
 */
export function armeniaAtsHashPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith(ARMENIA_COUNTRY_DIGITS) && digits.length === 11) {
    return `#0${digits.slice(ARMENIA_COUNTRY_DIGITS.length)}`;
  }
  if (digits.startsWith('0') && digits.length === ARMENIA_NATIONAL_LENGTH + 1) {
    return `#${digits}`;
  }
  return null;
}

export function googleContactPhoneValues(phones: readonly string[]): string[] {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const raw of phones) {
    const phone = raw.trim();
    if (!phone) continue;
    pushUnique(values, seen, phone);
    const hash = armeniaAtsHashPhone(phone);
    if (hash) pushUnique(values, seen, hash);
  }
  return values;
}

function pushUnique(values: string[], seen: Set<string>, value: string): void {
  if (seen.has(value)) return;
  seen.add(value);
  values.push(value);
}
