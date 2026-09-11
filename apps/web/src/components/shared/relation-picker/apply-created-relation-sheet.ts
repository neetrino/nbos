/**
 * After inline create, open the entity sheet with the created payload.
 * Do not clear the sheet first — open and content must land on the same render.
 */
export function applyCreatedRelationSheet<T extends { id: string }>(
  entity: T,
  setOpenId: (id: string) => void,
  setSheet: (entity: T) => void,
): void {
  setOpenId(entity.id);
  setSheet(entity);
}
