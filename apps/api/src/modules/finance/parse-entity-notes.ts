/** Trim optional entity `notes`; empty / whitespace becomes `null`. */
export function parseOptionalEntityNotes(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value?.trim() ?? '';
  return trimmed || null;
}
