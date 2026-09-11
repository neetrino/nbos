const MIN_PHONE_DIGITS_TO_MASK = 8;

/** Mask values that look like external phones. Short SIP extensions stay readable. */
export function maskAtsLogValue(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < MIN_PHONE_DIGITS_TO_MASK) return trimmed;
  if (trimmed.length <= 5) return '***';
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-2)}`;
}
