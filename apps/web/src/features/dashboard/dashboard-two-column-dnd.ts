import { arrayMove } from '@dnd-kit/sortable';

/**
 * Resolve drag between two sortable columns and optional empty drop zones.
 * `leftDropId` / `rightDropId` must not collide with item ids.
 */
export function resolveTwoColumnSortMove<T extends string>(
  activeId: string,
  overId: string | undefined,
  leftIds: T[],
  rightIds: T[],
  leftDropId: string,
  rightDropId: string,
): { left: T[]; right: T[] } | null {
  if (!overId) return null;

  const leftIndex = leftIds.indexOf(activeId as T);
  const rightIndex = rightIds.indexOf(activeId as T);
  const overLeft = leftIds.indexOf(overId as T);
  const overRight = rightIds.indexOf(overId as T);

  if (leftIndex >= 0 && overLeft >= 0 && activeId !== overId) {
    return { left: arrayMove(leftIds, leftIndex, overLeft), right: [...rightIds] };
  }
  if (rightIndex >= 0 && overRight >= 0 && activeId !== overId) {
    return { left: [...leftIds], right: arrayMove(rightIds, rightIndex, overRight) };
  }
  if (leftIndex >= 0 && overRight >= 0) {
    const left = leftIds.filter((id) => id !== activeId);
    const right = [...rightIds];
    right.splice(overRight, 0, activeId as T);
    return { left, right };
  }
  if (rightIndex >= 0 && overLeft >= 0) {
    const right = rightIds.filter((id) => id !== activeId);
    const left = [...leftIds];
    left.splice(overLeft, 0, activeId as T);
    return { left, right };
  }
  if (leftIndex >= 0 && overId === rightDropId) {
    return { left: leftIds.filter((id) => id !== activeId), right: [...rightIds, activeId as T] };
  }
  if (rightIndex >= 0 && overId === leftDropId) {
    return { left: [...leftIds, activeId as T], right: rightIds.filter((id) => id !== activeId) };
  }
  return null;
}
