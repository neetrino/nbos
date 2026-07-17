/** Display label for access slots — drop trailing "account" (Domain account → Domain). */
export function formatDeliveryAccessSlotLabel(label: string): string {
  return label.replace(/\s+account$/i, '').trim();
}

/**
 * Split "Admin / CMS access" into two lines: ["Admin /", "CMS access"].
 * Single-segment labels stay one line.
 */
export function splitDeliveryAccessSlotLabel(
  label: string,
): readonly [string] | readonly [string, string] {
  const formatted = formatDeliveryAccessSlotLabel(label);
  const separator = ' / ';
  const idx = formatted.indexOf(separator);
  if (idx === -1) return [formatted] as const;
  return [`${formatted.slice(0, idx)} /`, formatted.slice(idx + separator.length)] as const;
}
