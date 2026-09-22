'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  COMPOSITION_CORE_CHECK_SIZE_PX,
  COMPOSITION_CORE_ROW_CLASS,
} from './composition.constants';

export function CompositionCoreRail({
  title,
  items,
  included,
  loading,
  salePriceLabel,
  showSalePrice,
}: {
  title: string | null;
  items: Array<{ id: string; label: string; note: string | null }>;
  included: Array<{ id: string; title: string }>;
  loading: boolean;
  salePriceLabel?: string;
  showSalePrice: boolean;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <Card className="h-fit p-2">
      <p className="text-muted-foreground px-2 py-2 text-xs font-semibold tracking-wide uppercase">
        {t('coreLabel')}
      </p>
      {title ? <p className="text-muted-foreground px-2 pb-1 text-xs">{title}</p> : null}
      <CorePrice label={salePriceLabel} show={showSalePrice} unknownLabel={t('corePriceUnknown')} />
      {loading ? <p className="text-muted-foreground px-2 text-xs">{t('coreLoading')}</p> : null}
      <div className="space-y-1">
        {items.map((item) => (
          <CoreItemRow key={item.id} label={item.label} note={item.note} />
        ))}
      </div>
      <IncludedInBase items={included} badge={t('inBaseBadge')} note={t('inBaseNote')} />
    </Card>
  );
}

function CorePrice({
  label,
  show,
  unknownLabel,
}: {
  label?: string;
  show: boolean;
  unknownLabel: string;
}) {
  if (!show) return null;
  return (
    <p
      className={
        label
          ? 'text-foreground px-2 pb-2 text-xs font-medium tabular-nums'
          : 'text-muted-foreground px-2 pb-2 text-xs'
      }
    >
      {label ?? unknownLabel}
    </p>
  );
}

function IncludedInBase({
  items,
  badge,
  note,
}: {
  items: Array<{ id: string; title: string }>;
  badge: string;
  note: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="border-border mt-3 space-y-1 border-t px-2 pt-3">
      <p className="text-muted-foreground pb-1 text-xs">{note}</p>
      {items.map((item) => (
        <div key={item.id} className={COMPOSITION_CORE_ROW_CLASS}>
          <Check size={COMPOSITION_CORE_CHECK_SIZE_PX} className="text-primary mt-0.5 shrink-0" />
          <span className="text-foreground min-w-0 flex-1 truncate text-sm">{item.title}</span>
          <span className="text-muted-foreground shrink-0 text-[11px] font-medium">{badge}</span>
        </div>
      ))}
    </div>
  );
}

function CoreItemRow({ label, note }: { label: string; note: string | null }) {
  return (
    <div className={COMPOSITION_CORE_ROW_CLASS}>
      <Check size={COMPOSITION_CORE_CHECK_SIZE_PX} className="text-primary mt-0.5 shrink-0" />
      <span className="min-w-0">
        <span className="text-foreground block truncate text-sm">{label}</span>
        {note ? <span className="text-muted-foreground block text-xs">{note}</span> : null}
      </span>
    </div>
  );
}
