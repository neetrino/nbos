/** Empty-state hint for optional Description fields on detail sheets. */
export const ENTITY_NOTES_OPTIONAL_PLACEHOLDER = 'Optional notes…';

export function isOptionalEntityNotesPlaceholder(placeholder: string | undefined): boolean {
  if (!placeholder) return false;
  const normalized = placeholder.toLowerCase();
  return normalized.includes('optional') || normalized.includes('необязательн');
}
