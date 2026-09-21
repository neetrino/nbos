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
  loading,
  salePriceLabel,
  showSalePrice,
}: {
  title: string | null;
  items: Array<{ id: string; label: string; note: string | null }>;
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
      {showSalePrice ? (
        <p
          className={
            salePriceLabel
              ? 'text-foreground px-2 pb-2 text-xs font-medium tabular-nums'
              : 'text-muted-foreground px-2 pb-2 text-xs'
          }
        >
          {salePriceLabel ?? t('corePriceUnknown')}
        </p>
      ) : null}
      {loading ? <p className="text-muted-foreground px-2 text-xs">{t('coreLoading')}</p> : null}
      <div className="space-y-1">
        {items.map((item) => (
          <CoreItemRow key={item.id} label={item.label} note={item.note} />
        ))}
      </div>
    </Card>
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
