'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { ChecklistStageProgress, DeliveryLifecycleProjection } from '@/lib/api/projects';
import { formatDeliveryLifecycleLabel } from '@/features/projects/constants/projects';
import type { ApiFieldError } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import {
  buildExtensionStageReadinessRows,
  buildProductStageReadinessRows,
} from './delivery-stage-readiness-rows';
import { deliveryStageGateSectionClass } from './delivery-stage-gate-highlight';

interface DeliveryItemStageReadinessSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  product: FullProduct | null;
  extension: FullExtension | null;
  lifecycle: DeliveryLifecycleProjection | undefined;
  checklistProgress: ChecklistStageProgress | null | undefined;
  gateRequiredFields?: ReadonlySet<string>;
  stageGateActionBlockers?: ApiFieldError[];
}

export function DeliveryItemStageReadinessSection({
  kind,
  product,
  extension,
  lifecycle,
  checklistProgress,
  gateRequiredFields = new Set(),
  stageGateActionBlockers = [],
}: DeliveryItemStageReadinessSectionProps) {
  const rows =
    kind === 'PRODUCT' && product
      ? buildProductStageReadinessRows(product, lifecycle, checklistProgress)
      : kind === 'EXTENSION' && extension
        ? buildExtensionStageReadinessRows(extension, lifecycle, checklistProgress)
        : [];

  const readiness = lifecycle?.currentStageReadiness;

  if (!lifecycle || rows.length === 0) {
    return (
      <section className="border-border bg-card/40 rounded-xl border p-4">
        <h3 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-2')}>Stage readiness</h3>
        <p className="text-muted-foreground text-sm">No stage requirement rows for this state.</p>
      </section>
    );
  }

  const doneCount = rows.filter((r) => r.done).length;

  return (
    <section
      className={deliveryStageGateSectionClass(
        gateRequiredFields,
        'clientAcceptance',
        'border-border bg-card/40 rounded-xl border p-4',
      )}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0')}>Stage readiness</h3>
        <p className="text-muted-foreground text-xs">
          {formatDeliveryLifecycleLabel(lifecycle)}
          {readiness
            ? ` · ${readiness.completed}/${readiness.total}`
            : ` · ${doneCount}/${rows.length}`}
        </p>
      </div>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-2 text-sm">
            {row.done ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <span className={row.done ? 'text-muted-foreground' : 'text-foreground font-medium'}>
              {row.label}
            </span>
          </li>
        ))}
      </ul>
      {stageGateActionBlockers.length > 0 ? (
        <ul className="border-border mt-4 space-y-1.5 rounded-lg border border-red-200/80 bg-red-50/40 p-3 text-xs dark:border-red-900/50 dark:bg-red-950/20">
          {stageGateActionBlockers.map((blocker) => (
            <li key={`${blocker.field}-${blocker.message}`} className="text-foreground/90">
              {blocker.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
