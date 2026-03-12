'use client';

import { useState } from 'react';
import { DEAL_STAGES, type DealStage } from '../constants/dealPipeline';

const ARROW = 10;

const STAGE_COLORS: Record<string, string> = {
  START_CONVERSATION: '#7dd3fc',
  DISCUSS_NEEDS: '#38bdf8',
  MEETING: '#0ea5e9',
  CAN_WE_DO_IT: '#0284c7',
  SEND_OFFER: '#6366f1',
  GET_ANSWER: '#818cf8',
  DEPOSIT_AND_CONTRACT: '#a78bfa',
  CREATING: '#c084fc',
  GET_FINAL_PAY: '#f59e0b',
  MAINTENANCE_OFFER: '#14b8a6',
  FAILED: '#ef4444',
  WON: '#10b981',
};

function getClipPath(idx: number, total: number): string {
  if (idx === 0) {
    return `polygon(0 0, calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%, 0 100%)`;
  }
  if (idx === total - 1) {
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${ARROW}px 50%)`;
  }
  return `polygon(0 0, calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%, 0 100%, ${ARROW}px 50%)`;
}

interface DealPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
}

export function DealPipelineStages({ currentStatus, onStageClick }: DealPipelineStagesProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const stages = DEAL_STAGES;
  const total = stages.length;
  const currentIdx = stages.findIndex((s) => s.key === currentStatus);
  const isHovering = hoverIdx !== null;

  function getBgColor(stage: DealStage, i: number): string | undefined {
    const hi = hoverIdx;
    if (hi !== null) {
      const hoverStage = stages[hi];
      return i <= hi && hoverStage ? STAGE_COLORS[hoverStage.key] : undefined;
    }
    return i <= currentIdx ? STAGE_COLORS[stage.key] : undefined;
  }

  return (
    <div className="flex" onMouseLeave={() => setHoverIdx(null)}>
      {stages.map((stage, i) => {
        const bg = getBgColor(stage, i);
        const isActive = bg !== undefined;

        return (
          <button
            key={stage.key}
            onClick={() => onStageClick(stage.key)}
            onMouseEnter={() => setHoverIdx(i)}
            title={stage.label}
            style={{
              clipPath: getClipPath(i, total),
              backgroundColor: bg ?? undefined,
              marginLeft: i > 0 ? `-${ARROW}px` : 0,
            }}
            className={
              'relative flex h-9 flex-1 cursor-pointer items-center justify-center text-[10px] font-semibold transition-colors duration-150 select-none ' +
              (isActive
                ? 'text-white'
                : 'bg-stone-100 text-stone-400 dark:bg-stone-800/50 dark:text-stone-500')
            }
          >
            <span className="truncate px-1">{stage.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
