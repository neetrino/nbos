'use client';

import { useMemo, useState } from 'react';

export interface PipelineStageConfig {
  key: string;
  label: string;
  shortLabel: string;
}

const ARROW_W = 8;
const BAR_HEIGHT_PX = 36;
/** Corner round on chevron segments (viewBox units). */
const SEGMENT_CORNER_RADIUS = 5;
const DEFAULT_STAGE_COLOR = '#d4d4d4';
const INACTIVE_SEGMENT_FILL = '#e5e5e5';
const INACTIVE_TEXT_COLOR = '#737373';

type StagePathPoint = { x: number; y: number };

function stageSegmentPoints(isFirst: boolean, isLast: boolean): StagePathPoint[] {
  const h = BAR_HEIGHT_PX;
  const mid = h / 2;
  const rightShoulder = 100 - ARROW_W;

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
      { x: ARROW_W, y: mid },
    ];
  }
  return [
    { x: 0, y: 0 },
    { x: rightShoulder, y: 0 },
    { x: 100, y: mid },
    { x: rightShoulder, y: h },
    { x: 0, y: h },
    { x: ARROW_W, y: mid },
  ];
}

/** Polygon path with quadratic rounds; sharpCorners stay square (outer bar edges). */
function roundedPolygonPath(
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

function stageSegmentPath(isFirst: boolean, isLast: boolean): string {
  const points = stageSegmentPoints(isFirst, isLast);
  // First: square left edge. Last: square right edge. Chevrons stay rounded.
  const sharpCorners = isFirst
    ? new Set([0, points.length - 1])
    : isLast
      ? new Set([1, 2])
      : new Set<number>();
  return roundedPolygonPath(points, SEGMENT_CORNER_RADIUS, sharpCorners);
}

interface PipelineStagesBarProps {
  stages: readonly PipelineStageConfig[];
  stageColors: Record<string, string>;
  currentStatus: string;
  /** Fills all segments through the last stage (e.g. WON, PAID, Lead Won). */
  fillToEndStatuses?: readonly string[];
  disabled?: boolean;
  /** When set, only matching segments accept clicks (terminal outcomes may stay visible but gated). */
  canClickStage?: (stageKey: string, index: number) => boolean;
  onStageClick: (stageKey: string) => void;
}

export function PipelineStagesBar({
  stages,
  stageColors,
  currentStatus,
  fillToEndStatuses = [],
  disabled = false,
  canClickStage,
  onStageClick,
}: PipelineStagesBarProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const total = stages.length;
  const activeIdx = stages.findIndex((s) => s.key === currentStatus);
  const fillsToEnd = fillToEndStatuses.includes(currentStatus);
  const currentIdx = activeIdx >= 0 ? activeIdx : -1;

  const fillColor = useMemo(() => {
    if (fillsToEnd) {
      return stageColors[currentStatus] ?? DEFAULT_STAGE_COLOR;
    }
    if (hoverIdx !== null) {
      const hovered = stages[hoverIdx];
      return hovered ? (stageColors[hovered.key] ?? DEFAULT_STAGE_COLOR) : DEFAULT_STAGE_COLOR;
    }
    const current = stages[currentIdx];
    return current ? (stageColors[current.key] ?? DEFAULT_STAGE_COLOR) : DEFAULT_STAGE_COLOR;
  }, [fillsToEnd, currentStatus, hoverIdx, currentIdx, stageColors, stages]);

  function isFilled(index: number): boolean {
    if (hoverIdx !== null) return index <= hoverIdx;
    return index <= currentIdx;
  }

  return (
    <div
      className={`flex select-none ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      onMouseLeave={() => setHoverIdx(null)}
    >
      {stages.map((stage, index) => {
        const filled = isFilled(index);
        const isCurrent = index === currentIdx;
        const isFuture = !filled;
        const ownColor = stageColors[stage.key] ?? DEFAULT_STAGE_COLOR;
        const bg = filled ? fillColor : INACTIVE_SEGMENT_FILL;
        const textColor = filled ? '#fff' : INACTIVE_TEXT_COLOR;
        const isFirst = index === 0;
        const isLast = index === total - 1;
        const clickable = !disabled && (canClickStage == null || canClickStage(stage.key, index));

        return (
          <button
            key={stage.key}
            type="button"
            aria-disabled={!clickable}
            onClick={() => {
              if (clickable) onStageClick(stage.key);
            }}
            onMouseEnter={() => setHoverIdx(index)}
            title={stage.label}
            className={
              'relative flex-1 active:scale-[0.98] ' +
              (clickable ? 'cursor-pointer' : isFuture ? 'cursor-not-allowed' : 'cursor-default')
            }
            style={{
              height: BAR_HEIGHT_PX,
              marginLeft: isFirst ? 0 : -ARROW_W,
              zIndex: total - index,
            }}
          >
            <StageSegmentSvg
              filled={filled}
              emphasizeCurrent={isCurrent && hoverIdx === null}
              isFirst={isFirst}
              isLast={isLast}
              bg={bg}
              ownColor={ownColor}
            />
            <span
              className="text-s relative z-10 flex h-full items-center justify-center truncate px-1 leading-none font-semibold"
              style={{ color: textColor, transition: 'color 250ms ease' }}
            >
              {stage.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StageSegmentSvg({
  filled,
  emphasizeCurrent,
  isFirst,
  isLast,
  bg,
  ownColor,
}: {
  filled: boolean;
  emphasizeCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;
  bg: string;
  ownColor: string;
}) {
  const h = BAR_HEIGHT_PX;
  const path = stageSegmentPath(isFirst, isLast);

  return (
    <svg
      className="absolute inset-0 overflow-visible"
      width="100%"
      height={h}
      preserveAspectRatio="none"
      viewBox={`0 0 100 ${h}`}
      aria-hidden
    >
      <path
        d={path}
        fill={bg}
        stroke={emphasizeCurrent ? ownColor : filled ? 'rgba(255,255,255,0.3)' : '#ddd'}
        strokeWidth={emphasizeCurrent ? '1.5' : '0.5'}
        vectorEffect="non-scaling-stroke"
        className="transition-[fill] duration-[250ms] ease-in-out"
      />
    </svg>
  );
}
