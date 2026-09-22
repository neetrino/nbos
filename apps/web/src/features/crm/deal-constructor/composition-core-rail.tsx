'use client';

import { useTranslations } from 'next-intl';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CODE_PRODUCT_TYPE_CHEVRON_SIZE_PX } from '../components/code-product-type-picker/code-product-type-picker.constants';
import {
  CompositionCoreTypeMenu,
  type CompositionProductTypeChange,
} from './composition-core-type-menu';
import {
  COMPOSITION_CORE_CHECK_SIZE_PX,
  COMPOSITION_CORE_IDENTITY_CLASS,
  COMPOSITION_CORE_MARK_SIZE_PX,
  COMPOSITION_CORE_ROW_CLASS,
  COMPOSITION_DEAL_METRIC_PRICE_CLASS,
  COMPOSITION_DEAL_METRIC_PRICE_EMPTY_CLASS,
} from './composition.constants';

export function CompositionCoreRail({
  title,
  items,
  included,
  loading,
  salePriceLabel,
  showSalePrice,
  productType,
}: {
  title: string | null;
  items: Array<{ id: string; label: string; note: string | null }>;
  included: Array<{ id: string; title: string }>;
  loading: boolean;
  salePriceLabel?: string;
  showSalePrice: boolean;
  productType?: CompositionProductTypeChange | null;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const identity = (
    <CoreIdentity
      name={title ? t('coreNamed', { name: title }) : t('coreLabel')}
      priceLabel={salePriceLabel}
      showPrice={showSalePrice}
      unknownPrice={t('corePriceUnknown')}
      interactive={Boolean(productType) && !productType?.disabled}
    />
  );
  return (
    <Card className="h-fit p-2">
      {productType && !productType.disabled ? (
        <CompositionCoreTypeMenu change={productType}>{identity}</CompositionCoreTypeMenu>
      ) : (
        identity
      )}
      {loading ? <p className="text-muted-foreground px-2 text-xs">{t('coreLoading')}</p> : null}
      <div className="space-y-1">
        {items.map((item) => (
          <CoreItemRow key={item.id} label={item.label} />
        ))}
      </div>
      <IncludedInBase items={included} badge={t('inBaseBadge')} note={t('inBaseNote')} />
    </Card>
  );
}

function CoreIdentity({
  name,
  priceLabel,
  showPrice,
  unknownPrice,
  interactive,
}: {
  name: string;
  priceLabel?: string;
  showPrice: boolean;
  unknownPrice: string;
  interactive: boolean;
}) {
  return (
    <span className={cn(COMPOSITION_CORE_IDENTITY_CLASS, interactive && 'hover:bg-muted')}>
      <span className="bg-background border-border flex size-9 shrink-0 items-center justify-center rounded-lg border">
        <Layers size={COMPOSITION_CORE_MARK_SIZE_PX} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block truncate text-sm font-semibold tracking-tight">
          {name}
        </span>
        {showPrice ? <CoreIdentityPrice label={priceLabel} unknownPrice={unknownPrice} /> : null}
      </span>
      {interactive ? (
        <ChevronDown size={CODE_PRODUCT_TYPE_CHEVRON_SIZE_PX} className="shrink-0 opacity-70" />
      ) : null}
    </span>
  );
}

function CoreIdentityPrice({ label, unknownPrice }: { label?: string; unknownPrice: string }) {
  return (
    <span
      className={cn(
        'mt-0.5 block',
        label ? COMPOSITION_DEAL_METRIC_PRICE_CLASS : COMPOSITION_DEAL_METRIC_PRICE_EMPTY_CLASS,
      )}
    >
      {label ?? unknownPrice}
    </span>
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

function CoreItemRow({ label }: { label: string }) {
  return (
    <div className={COMPOSITION_CORE_ROW_CLASS}>
      <Check size={COMPOSITION_CORE_CHECK_SIZE_PX} className="text-primary mt-0.5 shrink-0" />
      <span className="text-foreground min-w-0 truncate text-sm">{label}</span>
    </div>
  );
}
