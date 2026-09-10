'use client';

import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  PIPELINE_SEGMENT_HEIGHT_PX,
  mobileStageArrowPath,
} from './pipeline-stage-segment-path';

type MobilePipelineStage = {
  key: string;
  label: string;
  shortLabel: string;
};

const DEFAULT_STAGE_COLOR = '#3B82F6';

interface PipelineStagesMobileSelectProps {
  stages: readonly MobilePipelineStage[];
  stageColors: Record<string, string>;
  currentStatus: string;
  disabled?: boolean;
  canClickStage?: (stageKey: string, index: number) => boolean;
  onStageClick: (stageKey: string) => void;
}

/** Single chevron trigger + stage list — mobile only; desktop keeps the full bar. */
export function PipelineStagesMobileSelect({
  stages,
  stageColors,
  currentStatus,
  disabled = false,
  canClickStage,
  onStageClick,
}: PipelineStagesMobileSelectProps) {
  const current = stages.find((stage) => stage.key === currentStatus) ?? stages[0];
  const fill = current ? (stageColors[current.key] ?? DEFAULT_STAGE_COLOR) : DEFAULT_STAGE_COLOR;
  const label = current?.label ?? current?.shortLabel ?? 'Stage';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          'relative w-full min-w-0 select-none outline-none',
          disabled && 'pointer-events-none opacity-60',
        )}
        style={{ height: PIPELINE_SEGMENT_HEIGHT_PX }}
        aria-label={`Stage: ${label}. Choose stage`}
      >
        <MobileStageArrowSvg fill={fill} />
        <span className="relative z-10 flex h-full min-w-0 items-center justify-between gap-2 pl-4 pr-7 text-sm leading-none font-semibold text-white">
          <span className="min-w-0 truncate text-left">{label}</span>
          <ChevronDown className="lucide-chevron-down size-4 shrink-0" aria-hidden />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn(
          'w-auto min-w-0 max-w-[min(100vw-2rem,22rem)]',
          'duration-200 ease-out',
        )}
      >
        {stages.map((stage, index) => {
          const clickable = !disabled && (canClickStage == null || canClickStage(stage.key, index));
          const active = stage.key === currentStatus;
          const color = stageColors[stage.key] ?? DEFAULT_STAGE_COLOR;

          return (
            <DropdownMenuItem
              key={stage.key}
              disabled={!clickable}
              onClick={() => {
                if (clickable) onStageClick(stage.key);
              }}
              className="gap-2"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="whitespace-nowrap">{stage.label}</span>
              {active ? <Check className="text-primary size-4 shrink-0" aria-hidden /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileStageArrowSvg({ fill }: { fill: string }) {
  const h = PIPELINE_SEGMENT_HEIGHT_PX;
  const path = mobileStageArrowPath();

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
        fill={fill}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
