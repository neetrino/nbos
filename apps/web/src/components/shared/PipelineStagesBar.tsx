'use client';

import { useMemo, useState } from 'react';

export interface PipelineStageConfig {
  key: string;
  label: string;
  shortLabel: string;
}

const ARROW_W = 8;
const BAR_HEIGHT_PX = 36;
const DEFAULT_STAGE_COLOR = '#d4d4d4';
const INACTIVE_SEGMENT_FILL = '#f0f0f0';
const INACTIVE_TEXT_COLOR = '#888';

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
              isCurrent={isCurrent}
              isFirst={isFirst}
              isLast={isLast}
              isFuture={isFuture}
              bg={bg}
              ownColor={ownColor}
            />
            <span
              className="relative z-10 flex h-full items-center justify-center truncate px-1 text-[10px] leading-none font-semibold"
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
  isCurrent,
  isFirst,
  isLast,
  isFuture,
  bg,
  ownColor,
}: {
  filled: boolean;
  isCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;
  isFuture: boolean;
  bg: string;
  ownColor: string;
}) {
  const h = BAR_HEIGHT_PX;
  const path = isFirst
    ? `M0,0 L${100 - ARROW_W},0 L100,${h / 2} L${100 - ARROW_W},${h} L0,${h} Z`
    : isLast
      ? `M0,0 L100,0 L100,${h} L0,${h} L${ARROW_W},${h / 2} Z`
      : `M0,0 L${100 - ARROW_W},0 L100,${h / 2} L${100 - ARROW_W},${h} L0,${h} L${ARROW_W},${h / 2} Z`;

  return (
    <svg
      className="absolute inset-0"
      width="100%"
      height={h}
      preserveAspectRatio="none"
      viewBox={`0 0 100 ${h}`}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      <path
        d={path}
        fill={bg}
        stroke={isCurrent ? ownColor : filled ? 'rgba(255,255,255,0.3)' : '#ddd'}
        strokeWidth={isCurrent ? '1.5' : '0.5'}
        vectorEffect="non-scaling-stroke"
        style={{ transition: 'fill 250ms ease' }}
      />
      {isFuture ? (
        <rect
          x={isFirst ? 0 : ARROW_W}
          y={h - 3}
          width={isLast ? 100 : isFirst ? 100 - ARROW_W : 100 - ARROW_W * 2}
          height="3"
          fill={ownColor}
          rx="0.5"
          style={{ transition: 'opacity 250ms ease' }}
        />
      ) : null}
    </svg>
  );
}
