import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  DELIVERY_READINESS_RING_SEGMENTS,
  DELIVERY_READINESS_RING_SIZE_PX,
} from './delivery-stage-readiness-ring.constants';

interface DeliveryStageReadinessRingProps {
  lifecycle: DeliveryLifecycleProjection;
}

/**
 * Current-stage readiness: filled segments when API provides counts; otherwise neutral ring.
 */
export function DeliveryStageReadinessRing({ lifecycle }: DeliveryStageReadinessRingProps) {
  if (lifecycle.isTerminal || !lifecycle.stage) {
    return null;
  }

  const readiness = lifecycle.currentStageReadiness;
  const size = DELIVERY_READINESS_RING_SIZE_PX;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.28;
  const segments = DELIVERY_READINESS_RING_SEGMENTS;
  const filled = readiness ? Math.min(readiness.total, Math.max(0, readiness.completed)) : null;
  const total = readiness?.total ?? segments;

  return (
    <div
      className="text-muted-foreground flex shrink-0 flex-col items-center text-[10px] leading-none"
      title={
        readiness
          ? `Stage readiness ${readiness.completed}/${readiness.total}`
          : 'Stage readiness: open details for full checklist'
      }
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        aria-hidden
      >
        {Array.from({ length: segments }).map((_, i) => {
          const a0 = (i * 2 * Math.PI) / segments - Math.PI / 2;
          const a1 = ((i + 1) * 2 * Math.PI) / segments - Math.PI / 2;
          const xo0 = cx + outerR * Math.cos(a0);
          const yo0 = cy + outerR * Math.sin(a0);
          const xo1 = cx + outerR * Math.cos(a1);
          const yo1 = cy + outerR * Math.sin(a1);
          const xi0 = cx + innerR * Math.cos(a0);
          const yi0 = cy + innerR * Math.sin(a0);
          const xi1 = cx + innerR * Math.cos(a1);
          const yi1 = cy + innerR * Math.sin(a1);
          const isDone = filled !== null ? i < Math.round((filled / total) * segments) : false;
          return (
            <path
              key={i}
              d={`M ${xo0} ${yo0} L ${xo1} ${yo1} L ${xi1} ${yi1} L ${xi0} ${yi0} Z`}
              className={
                filled === null
                  ? 'fill-muted-foreground/25'
                  : isDone
                    ? 'fill-emerald-500/90'
                    : 'fill-muted-foreground/30'
              }
            />
          );
        })}
      </svg>
      <span className="text-foreground mt-0.5 font-medium tabular-nums">
        {readiness ? `${readiness.completed}/${readiness.total}` : '·'}
      </span>
    </div>
  );
}
