const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the chip would show a raw entity id instead of a human name. */
export function isRawEntityIdLabel(
  label: string | null | undefined,
  id: string | null | undefined,
): boolean {
  const trimmed = label?.trim() ?? '';
  if (!trimmed) return true;
  if (id && trimmed === id) return true;
  return UUID_LIKE.test(trimmed);
}

/** Chip text: real name only — never a UUID / raw id fallback. */
export function relationPickerChipLabel(
  label: string | null | undefined,
  id: string | null | undefined,
): string {
  if (isRawEntityIdLabel(label, id)) return '';
  return label?.trim() ?? '';
}
