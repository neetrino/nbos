'use client';

import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PipelineStageConfig } from '@/components/shared/PipelineStagesBar';
import { cn } from '@/lib/utils';

/** Match {@link PipelineStagesBar} chevron geometry. */
const ARROW_W = 8;
const BAR_HEIGHT_PX = 36;
const SEGMENT_CORNER_RADIUS = 5;
const DEFAULT_STAGE_COLOR = '#d4d4d4';

interface CrmSheetPipelineStatusSelectProps {
  stages: readonly PipelineStageConfig[];
  stageColors: Record<string, string>;
  currentStatus: string;
  onStageChange: (stageKey: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Mobile pipeline status control — same rounded chevron as the desktop stages bar.
 */
export function CrmSheetPipelineStatusSelect({
  stages,
  stageColors,
  currentStatus,
  onStageChange,
  disabled = false,
  ariaLabel = 'Pipeline status',
}: CrmSheetPipelineStatusSelectProps) {
  const current = stages.find((stage) => stage.key === currentStatus);
  const fill = stageColors[currentStatus] ?? DEFAULT_STAGE_COLOR;
  const label = current?.label ?? currentStatus;

  return (
    <div className="w-full min-w-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'relative flex w-full min-w-0 items-center overflow-visible outline-none',
            'active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60',
          )}
          style={{ height: BAR_HEIGHT_PX }}
        >
          <PipelineChevronSvg fill={fill} />
          <span className="relative z-10 flex h-full w-full min-w-0 items-center justify-between gap-2 pr-5 pl-4">
            <span className="truncate text-sm font-semibold text-white">{label}</span>
            <ChevronDown className="size-4 shrink-0 text-white/90" aria-hidden />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-72 min-w-(--anchor-width) w-max max-w-[calc(85vw-1.5rem)]"
        >
          {stages.map((stage) => {
            const selected = stage.key === currentStatus;
            const color = stageColors[stage.key] ?? DEFAULT_STAGE_COLOR;
            return (
              <DropdownMenuItem
                key={stage.key}
                disabled={selected}
                onClick={() => onStageChange(stage.key)}
                className="gap-2"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">{stage.label}</span>
                {selected ? <Check className="size-4 shrink-0 opacity-70" aria-hidden /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function PipelineChevronSvg({ fill }: { fill: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 block overflow-visible"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox={`0 0 100 ${BAR_HEIGHT_PX}`}
      aria-hidden
    >
      <path
        d={pipelineFirstChevronPath()}
        fill={fill}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type Point = { x: number; y: number };

/** First-segment chevron — square left, smoothly rounded arrow tip (desktop bar). */
function pipelineFirstChevronPath(): string {
  const h = BAR_HEIGHT_PX;
  const mid = h / 2;
  const rightShoulder = 100 - ARROW_W;
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: rightShoulder, y: 0 },
    { x: 100, y: mid },
    { x: rightShoulder, y: h },
    { x: 0, y: h },
  ];
  // Square left edge; tip shoulders use quadratic rounds like PipelineStagesBar.
  return roundedPolygonPath(points, SEGMENT_CORNER_RADIUS, new Set([0, points.length - 1]));
}

function roundedPolygonPath(
  points: readonly Point[],
  radius: number,
  sharpCorners: ReadonlySet<number>,
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
      parts.push(index === 0 ? `M${curr.x},${curr.y}` : `L${curr.x},${curr.y}`);
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

    parts.push(index === 0 ? `M${startX},${startY}` : `L${startX},${startY}`);
    parts.push(`Q${curr.x},${curr.y} ${endX},${endY}`);
  }

  parts.push('Z');
  return parts.join(' ');
}
