'use client';

import { useState, useMemo } from 'react';
import { DEAL_STAGES } from '../constants/dealPipeline';

const STAGE_HEX: Record<string, string> = {
  START_CONVERSATION: '#56b5eb',
  DISCUSS_NEEDS: '#39a0d8',
  MEETING: '#3b82f6',
  CAN_WE_DO_IT: '#2563eb',
  SEND_OFFER: '#7c3aed',
  GET_ANSWER: '#8b5cf6',
  DEPOSIT_AND_CONTRACT: '#a855f7',
  FAILED: '#ef4444',
  WON: '#22c55e',
};

const ARROW_W = 8;
const H = 36;

interface DealPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
}

export function DealPipelineStages({ currentStatus, onStageClick }: DealPipelineStagesProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const stages = DEAL_STAGES;
  const total = stages.length;
  const currentIdx = stages.findIndex((s) => s.key === currentStatus);

  const fillColor = useMemo(() => {
    if (hoverIdx !== null) {
      const hStage = stages[hoverIdx];
      return hStage ? (STAGE_HEX[hStage.key] ?? '#d4d4d4') : '#d4d4d4';
    }
    const cStage = stages[currentIdx];
    return cStage ? (STAGE_HEX[cStage.key] ?? '#d4d4d4') : '#d4d4d4';
  }, [hoverIdx, currentIdx, stages]);

  function isFilled(i: number): boolean {
    if (hoverIdx !== null) return i <= hoverIdx;
    return i <= currentIdx;
  }

  return (
    <div className="flex select-none" onMouseLeave={() => setHoverIdx(null)}>
      {stages.map((stage, i) => {
        const filled = isFilled(i);
        const isFuture = !filled;
        const ownColor = STAGE_HEX[stage.key] ?? '#d4d4d4';
        const bg = filled ? fillColor : '#f0f0f0';
        const textColor = filled ? '#fff' : '#888';

        const isFirst = i === 0;
        const isLast = i === total - 1;

        return (
          <button
            key={stage.key}
            onClick={() => onStageClick(stage.key)}
            onMouseEnter={() => setHoverIdx(i)}
            title={stage.label}
            className="relative flex-1 cursor-pointer active:scale-[0.98]"
            style={{
              height: H,
              marginLeft: isFirst ? 0 : -ARROW_W,
              zIndex: total - i,
            }}
          >
            <svg
              className="absolute inset-0"
              width="100%"
              height={H}
              preserveAspectRatio="none"
              viewBox={`0 0 100 ${H}`}
              style={{ overflow: 'visible' }}
            >
              <path
                d={
                  isFirst
                    ? `M0,0 L${100 - ARROW_W},0 L100,${H / 2} L${100 - ARROW_W},${H} L0,${H} Z`
                    : isLast
                      ? `M0,0 L100,0 L100,${H} L0,${H} L${ARROW_W},${H / 2} Z`
                      : `M0,0 L${100 - ARROW_W},0 L100,${H / 2} L${100 - ARROW_W},${H} L0,${H} L${ARROW_W},${H / 2} Z`
                }
                fill={bg}
                stroke={filled ? 'rgba(255,255,255,0.3)' : '#ddd'}
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                style={{ transition: 'fill 250ms ease' }}
              />
              {isFuture && (
                <rect
                  x={isFirst ? 0 : ARROW_W}
                  y={H - 3}
                  width={isLast ? 100 - 0 : isFirst ? 100 - ARROW_W : 100 - ARROW_W * 2}
                  height="3"
                  fill={ownColor}
                  rx="0.5"
                  style={{ transition: 'opacity 250ms ease' }}
                />
              )}
            </svg>
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
