'use client';

import { useMemo, useState } from 'react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { PipelineStagesMobileSelect } from './PipelineStagesMobileSelect';
import {
  PIPELINE_SEGMENT_ARROW_W,
  PIPELINE_SEGMENT_HEIGHT_PX,
  stageSegmentPath,
} from './pipeline-stage-segment-path';

export interface PipelineStageConfig {
  key: string;
  label: string;
  shortLabel: string;
}

const DEFAULT_STAGE_COLOR = '#d4d4d4';
const INACTIVE_SEGMENT_FILL = '#e5e5e5';
const INACTIVE_TEXT_COLOR = '#737373';

interface PipelineStagesBarProps {
  stages: readonly PipelineStageConfig[];
  stageColors: Record<string, string>;
  currentStatus: string;
  fillToEndStatuses?: readonly string[];
  disabled?: boolean;
  segmentGapPx?: number;
  canClickStage?: (stageKey: string, index: number) => boolean;
  onStageClick: (stageKey: string) => void;
}

export function PipelineStagesBar({
  stages,
  stageColors,
  currentStatus,
  fillToEndStatuses = [],
  disabled = false,
  segmentGapPx = 0,
  canClickStage,
  onStageClick,
}: PipelineStagesBarProps) {
  const isMobileViewport = useIsMobileViewport();
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

  if (isMobileViewport) {
    return (
      <PipelineStagesMobileSelect
        stages={stages}
        stageColors={stageColors}
        currentStatus={currentStatus}
        disabled={disabled}
        canClickStage={canClickStage}
        onStageClick={onStageClick}
      />
    );
  }

  function isFilled(index: number): boolean {
    if (hoverIdx !== null) return index <= hoverIdx;
    return index <= currentIdx;
  }

  return (
    <div
      className={`flex w-full min-w-0 select-none ${disabled ? 'pointer-events-none opacity-60' : ''}`}
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
              'relative min-w-0 flex-1 active:scale-[0.98] ' +
              (clickable ? 'cursor-pointer' : isFuture ? 'cursor-not-allowed' : 'cursor-default')
            }
            style={{
              height: PIPELINE_SEGMENT_HEIGHT_PX,
              marginLeft: isFirst ? 0 : -PIPELINE_SEGMENT_ARROW_W + segmentGapPx,
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
  const h = PIPELINE_SEGMENT_HEIGHT_PX;
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
