'use client';

import { useMemo, useState } from 'react';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import { ACTIVE_DELIVERY_STAGES } from './project-delivery-board-model';

const ARROW_W = 8;
const H = 36;

/** UI keys for terminal actions (not API stage enums). */
export const DELIVERY_PIPELINE_DONE_KEY = '__DONE__';
export const DELIVERY_PIPELINE_CANCEL_KEY = '__CANCEL__';

export type DeliveryPipelineClickKey =
  | (typeof ACTIVE_DELIVERY_STAGES)[number]
  | typeof DELIVERY_PIPELINE_DONE_KEY
  | typeof DELIVERY_PIPELINE_CANCEL_KEY;

/** Saturated fills aligned with CRM `DealPipelineStages` (bright blues / violets, not muted indigo). */
const STAGE_HEX: Record<string, string> = {
  STARTING: '#22c55e',
  DEVELOPMENT: '#2563eb',
  QA: '#7c3aed',
  TRANSFER: '#a855f7',
  [DELIVERY_PIPELINE_DONE_KEY]: '#22c55e',
  [DELIVERY_PIPELINE_CANCEL_KEY]: '#ef4444',
};

const ACTIVE_SHORT: Record<(typeof ACTIVE_DELIVERY_STAGES)[number], string> = {
  STARTING: 'Start',
  DEVELOPMENT: 'Dev',
  QA: 'QA',
  TRANSFER: 'Transfer',
};

const CHEVRONS: Array<{
  key: DeliveryPipelineClickKey;
  shortLabel: string;
}> = [
  ...ACTIVE_DELIVERY_STAGES.map((key) => ({
    key,
    shortLabel: ACTIVE_SHORT[key],
  })),
  { key: DELIVERY_PIPELINE_DONE_KEY, shortLabel: 'Done' },
  { key: DELIVERY_PIPELINE_CANCEL_KEY, shortLabel: 'Cancel' },
];

function currentChevronIndex(lifecycle: DeliveryLifecycleProjection | undefined): number {
  if (!lifecycle) return -1;
  if (lifecycle.isTerminal && lifecycle.resolution === 'DONE') {
    return ACTIVE_DELIVERY_STAGES.length;
  }
  if (lifecycle.isTerminal && lifecycle.resolution === 'CANCELLED') {
    return CHEVRONS.length - 1;
  }
  if (lifecycle.stage) {
    const i = ACTIVE_DELIVERY_STAGES.indexOf(lifecycle.stage);
    return i >= 0 ? i : -1;
  }
  return -1;
}

interface DeliveryPipelineStagesProps {
  lifecycle: DeliveryLifecycleProjection | undefined;
  disabled?: boolean;
  onSelect: (key: DeliveryPipelineClickKey) => void;
}

export function DeliveryPipelineStages({
  lifecycle,
  disabled = false,
  onSelect,
}: DeliveryPipelineStagesProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const total = CHEVRONS.length;
  const currentIdx = currentChevronIndex(lifecycle);
  const terminal = Boolean(lifecycle?.isTerminal);

  const fillColor = useMemo(() => {
    if (hoverIdx !== null) {
      const h = CHEVRONS[hoverIdx];
      return h ? (STAGE_HEX[h.key] ?? '#d4d4d4') : '#d4d4d4';
    }
    if (currentIdx >= 0) {
      const c = CHEVRONS[currentIdx];
      return c ? (STAGE_HEX[c.key] ?? '#d4d4d4') : '#d4d4d4';
    }
    return '#d4d4d4';
  }, [hoverIdx, currentIdx]);

  function isFilled(i: number): boolean {
    if (hoverIdx !== null) return i <= hoverIdx;
    if (currentIdx < 0) return false;
    return i <= currentIdx;
  }

  return (
    <div className="flex px-5 py-2.5 select-none" onMouseLeave={() => setHoverIdx(null)}>
      <div className="flex w-full">
        {CHEVRONS.map((stage, i) => {
          const filled = isFilled(i);
          const isFuture = !filled;
          const ownColor = STAGE_HEX[stage.key] ?? '#d4d4d4';
          const bg = filled ? fillColor : '#f0f0f0';
          const textColor = filled ? '#fff' : '#888';
          const isFirst = i === 0;
          const isLast = i === total - 1;

          const isClickable =
            !disabled &&
            !terminal &&
            lifecycle?.workStatus !== 'ON_HOLD' &&
            (() => {
              if (stage.key === DELIVERY_PIPELINE_DONE_KEY) {
                return Boolean(lifecycle?.stage);
              }
              if (stage.key === DELIVERY_PIPELINE_CANCEL_KEY) {
                return Boolean(lifecycle?.stage);
              }
              const activeIdx =
                lifecycle?.stage != null ? ACTIVE_DELIVERY_STAGES.indexOf(lifecycle.stage) : -1;
              const targetIdx = ACTIVE_DELIVERY_STAGES.indexOf(
                stage.key as (typeof ACTIVE_DELIVERY_STAGES)[number],
              );
              return activeIdx >= 0 && targetIdx > activeIdx;
            })();

          return (
            <button
              key={stage.key}
              type="button"
              disabled={!isClickable}
              onClick={() => {
                if (isClickable) onSelect(stage.key);
              }}
              onMouseEnter={() => setHoverIdx(i)}
              title={stage.shortLabel}
              className="relative flex-1 cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
    </div>
  );
}
