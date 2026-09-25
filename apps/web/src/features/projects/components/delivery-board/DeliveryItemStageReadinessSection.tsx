'use client';

import { CheckCircle2, Circle, Gauge } from 'lucide-react';
import { InsightSheetSection } from '@/components/shared';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { ChecklistStageProgress, DeliveryLifecycleProjection } from '@/lib/api/projects';
import { useTranslations } from 'next-intl';
import {
  translateDeliveryLifecycleLabel,
  translateReadinessDetail,
  translateReadinessLabel,
} from './delivery-board-message-keys';
import type { ApiFieldError } from '@/lib/api-errors';
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
  const t = useTranslations('deliveryBoard');
  const rows =
    kind === 'PRODUCT' && product
      ? buildProductStageReadinessRows(product, lifecycle, checklistProgress)
      : kind === 'EXTENSION' && extension
        ? buildExtensionStageReadinessRows(extension, lifecycle, checklistProgress)
        : [];

  const readiness = lifecycle?.currentStageReadiness;

  if (!lifecycle || rows.length === 0) {
    return (
      <InsightSheetSection
        icon={<Gauge size={15} />}
        title={t('readiness.title')}
        hint={t('sheetHints.readiness')}
      >
        <p className="text-muted-foreground text-sm">{t('readiness.empty')}</p>
      </InsightSheetSection>
    );
  }

  const doneCount = rows.filter((r) => r.done).length;
  const progress = readiness
    ? `${readiness.completed}/${readiness.total}`
    : `${doneCount}/${rows.length}`;

  return (
    <InsightSheetSection
      icon={<Gauge size={15} />}
      title={t('readiness.title')}
      hint={t('sheetHints.readiness')}
      className={deliveryStageGateSectionClass(gateRequiredFields, 'clientAcceptance')}
      trailing={
        <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {progress}
        </span>
      }
    >
      <p className="text-muted-foreground mb-2 text-xs">
        {translateDeliveryLifecycleLabel(lifecycle, t)}
      </p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-2.5 rounded-xl px-1.5 py-1.5 text-sm">
            {row.done ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className={row.done ? 'text-muted-foreground' : 'text-foreground font-medium'}>
                {translateReadinessLabel(row.label, t)}
              </p>
              {row.detail ? (
                <p className="text-muted-foreground mt-0.5 text-xs whitespace-nowrap">
                  {translateReadinessDetail(row.key, checklistProgress, t, row.detail)}
                </p>
              ) : null}
            </div>
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
    </InsightSheetSection>
  );
}
