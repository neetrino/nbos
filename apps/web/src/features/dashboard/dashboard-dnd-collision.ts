import type { CollisionDetection } from '@dnd-kit/core';
import { closestCenter, pointerWithin } from '@dnd-kit/core';

/**
 * Prefer the droppable under the pointer so cross-column moves register reliably
 * when columns are stacked vertically (closestCenter often stays on the source column).
 */
export const dashboardPointerCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return closestCenter(args);
};
