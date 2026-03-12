'use client';

import { Check, ChevronRight } from 'lucide-react';
import { ACTIVE_DEAL_STAGES } from '../constants/dealPipeline';
import { cn } from '@/lib/utils';

interface DealPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
}

export function DealPipelineStages({ currentStatus, onStageClick }: DealPipelineStagesProps) {
  const currentIdx = ACTIVE_DEAL_STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-stone-300/50 overflow-x-auto">
      <div className="flex min-w-max items-center gap-0.5">
        {ACTIVE_DEAL_STAGES.map((stage, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={stage.key} className="flex items-center">
              <button
                onClick={() => onStageClick(stage.key)}
                title={stage.label}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all',
                  'hover:brightness-95 active:scale-[0.97]',
                  isPast && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                  isCurrent &&
                    'bg-amber-500 text-white shadow-md shadow-amber-500/25 dark:bg-amber-500 dark:text-white',
                  !isPast &&
                    !isCurrent &&
                    'hover:bg-stone-150 bg-stone-100 text-stone-400 dark:bg-stone-800/40 dark:text-stone-500',
                )}
              >
                {isPast && <Check size={10} className="shrink-0 stroke-[3]" />}
                <span className="whitespace-nowrap">{stage.label}</span>
              </button>
              {i < ACTIVE_DEAL_STAGES.length - 1 && (
                <ChevronRight
                  size={11}
                  className={cn(
                    'mx-0.5 shrink-0',
                    i < currentIdx
                      ? 'text-amber-300 dark:text-amber-700'
                      : 'text-stone-200 dark:text-stone-700',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
