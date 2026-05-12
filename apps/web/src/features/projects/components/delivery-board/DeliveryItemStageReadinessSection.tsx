'use client';

import { AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { ChecklistStageProgress, DeliveryLifecycleProjection } from '@/lib/api/projects';
import { formatDeliveryLifecycleLabel } from '@/features/projects/constants/projects';
import {
  buildExtensionStageReadinessRows,
  buildProductStageReadinessRows,
} from './delivery-stage-readiness-rows';

interface DeliveryItemStageReadinessSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  product: FullProduct | null;
  extension: FullExtension | null;
  lifecycle: DeliveryLifecycleProjection | undefined;
  checklistProgress: ChecklistStageProgress | null | undefined;
}

export function DeliveryItemStageReadinessSection({
  kind,
  product,
  extension,
  lifecycle,
  checklistProgress,
}: DeliveryItemStageReadinessSectionProps) {
  const rows =
    kind === 'PRODUCT' && product
      ? buildProductStageReadinessRows(product, lifecycle, checklistProgress)
      : kind === 'EXTENSION' && extension
        ? buildExtensionStageReadinessRows(extension, lifecycle, checklistProgress)
        : [];

  const readiness = lifecycle?.currentStageReadiness;
  const blockers =
    kind === 'PRODUCT' && product?.doneReadiness?.blockers?.length
      ? product.doneReadiness.blockers.slice(0, 4)
      : [];

  if (!lifecycle || rows.length === 0) {
    return (
      <section className="border-border bg-card/40 rounded-xl border p-5">
        <h3 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">
          Stage readiness
        </h3>
        <p className="text-muted-foreground text-sm">No stage requirement rows for this state.</p>
      </section>
    );
  }

  const doneCount = rows.filter((r) => r.done).length;

  return (
    <section className="border-border bg-card/40 rounded-xl border p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
          Stage readiness
        </h3>
        <p className="text-muted-foreground text-xs">
          {formatDeliveryLifecycleLabel(lifecycle)}
          {readiness
            ? ` · ${readiness.completed}/${readiness.total}`
            : ` · ${doneCount}/${rows.length}`}
        </p>
      </div>
      <ul className="space-y-2">
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
      {blockers.length > 0 ? (
        <div className="border-border mt-4 rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <AlertTriangle className="size-3.5 text-amber-600" aria-hidden />
            Completion blockers
          </p>
          <ul className="space-y-1 text-xs">
            {blockers.map((b) => (
              <li key={b.code} className="text-foreground/90">
                {b.label}: {b.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
