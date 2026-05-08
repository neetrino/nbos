import { StatusBadge } from '@/components/shared';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  formatDeliveryHoldUntil,
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
  isDeliveryHoldExpired,
} from '@/features/projects/constants/projects';

const DELIVERY_STAGES = [
  { value: 'STARTING', label: 'Starting' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'QA', label: 'QA' },
  { value: 'TRANSFER', label: 'Transfer' },
] as const;

interface DeliveryStageTimelineCardProps {
  lifecycle: DeliveryLifecycleProjection;
  title: string;
  description?: string;
  /** When true, shows lifecycle status badge in the header (e.g. product overview). */
  showLifecycleBadge?: boolean;
}

/**
 * Four-stage delivery timeline with current / done / future styling (canon §8.5 visual baseline).
 */
export function DeliveryStageTimelineCard({
  lifecycle,
  title,
  description,
  showLifecycleBadge = false,
}: DeliveryStageTimelineCardProps) {
  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? (
            <p className="text-muted-foreground mt-1 max-w-prose text-xs">{description}</p>
          ) : null}
        </div>
        {showLifecycleBadge ? (
          <StatusBadge
            label={formatDeliveryLifecycleLabel(lifecycle)}
            variant={getDeliveryLifecycleVariant(lifecycle)}
          />
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {DELIVERY_STAGES.map((stage) => (
          <DeliveryStageStep key={stage.value} stage={stage} lifecycle={lifecycle} />
        ))}
      </div>
      {lifecycle.currentStageReadiness && !lifecycle.isTerminal ? (
        <p className="text-muted-foreground mt-3 text-xs font-medium">
          Current stage requirements: {lifecycle.currentStageReadiness.completed}/
          {lifecycle.currentStageReadiness.total}
        </p>
      ) : null}
      {lifecycle.workStatus === 'ON_HOLD' ? <HoldStateCopy lifecycle={lifecycle} /> : null}
    </section>
  );
}

function HoldStateCopy({ lifecycle }: { lifecycle: DeliveryLifecycleProjection }) {
  const date = formatDeliveryHoldUntil(lifecycle.onHoldUntil);
  const expired = isDeliveryHoldExpired(lifecycle);
  const dateCopy = date ? ` until ${date}` : '';
  const copy = expired
    ? `Delivery hold expired${date ? ` on ${date}` : ''}. Resume or update the delivery pause.`
    : `Delivery is paused${dateCopy}. Resume delivery when work can continue.`;

  return (
    <p
      className={`mt-3 text-xs ${expired ? 'font-medium text-amber-600' : 'text-muted-foreground'}`}
    >
      {copy}
    </p>
  );
}

function DeliveryStageStep({
  stage,
  lifecycle,
}: {
  stage: (typeof DELIVERY_STAGES)[number];
  lifecycle: DeliveryLifecycleProjection;
}) {
  const currentIndex = DELIVERY_STAGES.findIndex((item) => item.value === lifecycle.stage);
  const stageIndex = DELIVERY_STAGES.findIndex((item) => item.value === stage.value);
  const isCurrent = lifecycle.stage === stage.value && !lifecycle.resolution;
  const isDone =
    lifecycle.resolution === 'DONE' || (currentIndex >= 0 && stageIndex < currentIndex);
  const stateClassName = getStageStepClassName({ isCurrent, isDone, lifecycle });

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${stateClassName}`}>
      {stage.label}
    </div>
  );
}

function getStageStepClassName({
  isCurrent,
  isDone,
  lifecycle,
}: {
  isCurrent: boolean;
  isDone: boolean;
  lifecycle: DeliveryLifecycleProjection;
}) {
  if (lifecycle.resolution === 'CANCELLED') return 'border-red-200 bg-red-50 text-red-700';
  if (isCurrent && lifecycle.workStatus === 'ON_HOLD') {
    if (isDeliveryHoldExpired(lifecycle)) return 'border-amber-300 bg-amber-50 text-amber-700';
    return 'border-gray-300 bg-gray-100 text-gray-700';
  }
  if (isCurrent) return 'border-purple-300 bg-purple-50 text-purple-700';
  if (isDone) return 'border-green-200 bg-green-50 text-green-700';
  return 'border-border bg-muted/30 text-muted-foreground';
}
