/** Shared chevron segment geometry for pipeline bars (desktop + mobile trigger). */

export const PIPELINE_SEGMENT_ARROW_W = 8;
export const PIPELINE_SEGMENT_HEIGHT_PX = 36;
/** Corner round on chevron segments (viewBox units). */
export const PIPELINE_SEGMENT_CORNER_RADIUS = 5;
/** Softer standalone mobile trigger (full-width single arrow). */
export const PIPELINE_MOBILE_ARROW_CORNER_RADIUS = 8;

type StagePathPoint = { x: number; y: number };

export function stageSegmentPoints(isFirst: boolean, isLast: boolean): StagePathPoint[] {
  const h = PIPELINE_SEGMENT_HEIGHT_PX;
  const mid = h / 2;
  const rightShoulder = 100 - PIPELINE_SEGMENT_ARROW_W;

  if (isFirst) {
    return [
      { x: 0, y: 0 },
      { x: rightShoulder, y: 0 },
      { x: 100, y: mid },
      { x: rightShoulder, y: h },
      { x: 0, y: h },
    ];
  }
  if (isLast) {
    return [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: h },
      { x: 0, y: h },
      { x: PIPELINE_SEGMENT_ARROW_W, y: mid },
    ];
  }
  return [
    { x: 0, y: 0 },
    { x: rightShoulder, y: 0 },
    { x: 100, y: mid },
    { x: rightShoulder, y: h },
    { x: 0, y: h },
    { x: PIPELINE_SEGMENT_ARROW_W, y: mid },
  ];
}

/** Polygon path with quadratic rounds; sharpCorners stay square (outer bar edges). */
export function roundedPolygonPath(
  points: readonly StagePathPoint[],
  radius: number,
  sharpCorners: ReadonlySet<number> = new Set(),
): string {
  const count = points.length;
  if (count < 3) return '';

  const parts: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const prev = points[(index - 1 + count) % count];
    const curr = points[index];
    const next = points[(index + 1) % count];
    if (!prev || !curr || !next) continue;

    if (sharpCorners.has(index)) {
      if (index === 0) {
        parts.push(`M${curr.x},${curr.y}`);
      } else {
        parts.push(`L${curr.x},${curr.y}`);
      }
      continue;
    }

    const toPrevX = prev.x - curr.x;
    const toPrevY = prev.y - curr.y;
    const toNextX = next.x - curr.x;
    const toNextY = next.y - curr.y;
    const lenPrev = Math.hypot(toPrevX, toPrevY);
    const lenNext = Math.hypot(toNextX, toNextY);
    if (lenPrev === 0 || lenNext === 0) continue;

    const trimPrev = Math.min(radius, lenPrev / 2);
    const trimNext = Math.min(radius, lenNext / 2);
    const startX = curr.x + (toPrevX / lenPrev) * trimPrev;
    const startY = curr.y + (toPrevY / lenPrev) * trimPrev;
    const endX = curr.x + (toNextX / lenNext) * trimNext;
    const endY = curr.y + (toNextY / lenNext) * trimNext;

    if (index === 0) {
      parts.push(`M${startX},${startY}`);
    } else {
      parts.push(`L${startX},${startY}`);
    }
    parts.push(`Q${curr.x},${curr.y} ${endX},${endY}`);
  }

  parts.push('Z');
  return parts.join(' ');
}

export function stageSegmentPath(isFirst: boolean, isLast: boolean): string {
  const points = stageSegmentPoints(isFirst, isLast);
  const sharpCorners = isFirst
    ? new Set([0, points.length - 1])
    : isLast
      ? new Set([1, 2])
      : new Set<number>();
  return roundedPolygonPath(points, PIPELINE_SEGMENT_CORNER_RADIUS, sharpCorners);
}

/** Full-width mobile stage trigger — straight left edge, soft chevron tip (like first bar segment). */
export function mobileStageArrowPath(): string {
  const points = stageSegmentPoints(true, false);
  // Left edge square (indices 0 and last); tip / shoulders stay rounded.
  return roundedPolygonPath(
    points,
    PIPELINE_MOBILE_ARROW_CORNER_RADIUS,
    new Set([0, points.length - 1]),
  );
}
