/** Fixed preview height — always start with a short peek for any description. */
export const ENTITY_NOTES_COLLAPSED_PREVIEW_HEIGHT_PX = 200;

/** Ignore sub-pixel / padding noise when comparing full vs preview height. */
export const ENTITY_NOTES_COLLAPSE_OVERFLOW_TOLERANCE_PX = 8;

export function notesContentCanCollapse(fullHeightPx: number): boolean {
  return (
    fullHeightPx >
    ENTITY_NOTES_COLLAPSED_PREVIEW_HEIGHT_PX + ENTITY_NOTES_COLLAPSE_OVERFLOW_TOLERANCE_PX
  );
}
