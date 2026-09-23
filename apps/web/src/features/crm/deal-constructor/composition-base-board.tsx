'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CODE_PRODUCT_TYPE_CHEVRON_SIZE_PX } from '../components/code-product-type-picker/code-product-type-picker.constants';
import {
  CompositionCoreTypeMenu,
  type CompositionProductTypeChange,
} from './composition-core-type-menu';
import { CompositionLevelCard } from './composition-level-card';
import { VolumeFactorControl } from './volume-factor-control';
import {
  COMPOSITION_BASE_BADGE_VARIANT,
  COMPOSITION_CARD_GRID_CLASS,
  COMPOSITION_CORE_BADGE_VARIANT,
  COMPOSITION_CORE_CARD_CLASS,
  COMPOSITION_CORE_IDENTITY_CLASS,
  COMPOSITION_SUMMARY_WIDTH_CLASS,
  COMPOSITION_CORE_MARK_SIZE_PX,
  COMPOSITION_DEAL_METRIC_PRICE_CLASS,
  COMPOSITION_DEAL_METRIC_PRICE_EMPTY_CLASS,
} from './composition.constants';

type IncludedFunction = { id: string; title: string; iconKey?: string };

type CoreScopeItem = { id: string; label: string; note: string | null };

type CompositionBaseBoardProps = {
  title: string | null;
  items: CoreScopeItem[];
  included: IncludedFunction[];
  loading: boolean;
  salePriceLabel?: string;
  showSalePrice: boolean;
  productType?: CompositionProductTypeChange | null;
  volumeFactor?: string;
  volumeDisabled?: boolean;
  onVolume?: (factor: string, reason: string | null) => void;
  baseLabel?: string | null;
};

export function CompositionBaseBoard(props: CompositionBaseBoardProps) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <div className="flex flex-col gap-3">
      <BaseIdentityRow
        {...props}
        unknownPrice={t('corePriceUnknown')}
        name={props.title ? t('coreNamed', { name: props.title }) : t('coreLabel')}
      />
      {props.loading ? <p className="text-muted-foreground text-xs">{t('coreLoading')}</p> : null}
      <BaseCardGrid
        items={props.items}
        included={props.included}
        coreBadge={t('coreLabel')}
        baseBadge={t('inBaseBadge')}
        baseNote={props.included.length > 0 ? t('inBaseNote') : null}
      />
    </div>
  );
}

export function CompositionSummaryRow({
  label,
  children,
}: {
  label?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-4">
      <div className={COMPOSITION_SUMMARY_WIDTH_CLASS}>{children}</div>
      {label ? (
        <div className="flex min-w-0 flex-1 items-center">
          <CompositionBaseRule label={label} />
        </div>
      ) : null}
    </div>
  );
}

export function CompositionBaseRule({ label }: { label: string }) {
  return (
    <div className="flex w-full items-center gap-3">
      <span className="bg-border h-px flex-1" />
      <p className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wide uppercase">
        {label}
      </p>
      <span className="bg-border h-px flex-1" />
    </div>
  );
}

function BaseIdentityRow({
  name,
  salePriceLabel,
  showSalePrice,
  unknownPrice,
  productType,
  volumeFactor,
  volumeDisabled,
  onVolume,
  baseLabel,
}: CompositionBaseBoardProps & { name: string; unknownPrice: string }) {
  const identity = (
    <CoreIdentity
      name={name}
      priceLabel={salePriceLabel}
      showPrice={showSalePrice}
      unknownPrice={unknownPrice}
      interactive={Boolean(productType) && !productType?.disabled}
    />
  );
  return (
    <CompositionSummaryRow label={baseLabel}>
      <div className={COMPOSITION_CORE_CARD_CLASS}>
        {productType && !productType.disabled ? (
          <CompositionCoreTypeMenu change={productType}>{identity}</CompositionCoreTypeMenu>
        ) : (
          identity
        )}
        {onVolume && volumeFactor ? (
          <VolumeFactorControl
            density="summary"
            factor={volumeFactor}
            disabled={volumeDisabled}
            onCommit={onVolume}
          />
        ) : null}
      </div>
    </CompositionSummaryRow>
  );
}

function BaseCardGrid({
  items,
  included,
  coreBadge,
  baseBadge,
  baseNote,
}: {
  items: CoreScopeItem[];
  included: IncludedFunction[];
  coreBadge: string;
  baseBadge: string;
  baseNote: string | null;
}) {
  if (items.length === 0 && included.length === 0) return null;
  return (
    <div className={COMPOSITION_CARD_GRID_CLASS}>
      {items.map((item) => (
        <CompositionLevelCard
          key={`core-${item.id}`}
          title={item.label}
          note={item.note}
          badge={coreBadge}
          badgeVariant={COMPOSITION_CORE_BADGE_VARIANT}
        />
      ))}
      {included.map((item) => (
        <CompositionLevelCard
          key={`base-${item.id}`}
          title={item.title}
          note={baseNote}
          iconKey={item.iconKey}
          badge={baseBadge}
          badgeVariant={COMPOSITION_BASE_BADGE_VARIANT}
        />
      ))}
    </div>
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
      <span className="bg-background border-border flex size-8 shrink-0 items-center justify-center rounded-lg border">
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
