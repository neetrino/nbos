'use client';

import { useState, useMemo } from 'react';
import { ACTIVE_LEAD_STAGES, TERMINAL_LEAD_STAGES } from '../constants/leadPipeline';

const STAGE_HEX: Record<string, string> = {
  NEW: '#3b82f6',
  DIDNT_GET_THROUGH: '#9ca3af',
  CONTACT_ESTABLISHED: '#6366f1',
  MQL: '#a855f7',
  SPAM: '#ef4444',
  FROZEN: '#06b6d4',
  SQL: '#10b981',
};

const ARROW_W = 8;
const H = 36;

interface LeadPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
}

export function LeadPipelineStages({ currentStatus, onStageClick }: LeadPipelineStagesProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const stages = ACTIVE_LEAD_STAGES;
  const total = stages.length;
  const currentIdx = stages.findIndex((s) => s.key === currentStatus);
  const isTerminal = TERMINAL_LEAD_STAGES.some((s) => s.key === currentStatus);

  const fillColor = useMemo(() => {
    if (isTerminal) return STAGE_HEX[currentStatus] ?? '#d4d4d4';
    if (hoverIdx !== null) {
      const hStage = stages[hoverIdx];
      return hStage ? (STAGE_HEX[hStage.key] ?? '#d4d4d4') : '#d4d4d4';
    }
    const cStage = stages[currentIdx];
    return cStage ? (STAGE_HEX[cStage.key] ?? '#d4d4d4') : '#d4d4d4';
  }, [hoverIdx, currentIdx, stages, isTerminal, currentStatus]);

  function isFilled(i: number): boolean {
    if (isTerminal) return true;
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
              {stage.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
