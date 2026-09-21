'use client';

import type { ReactNode } from 'react';
import { Minus } from 'lucide-react';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CatalogFunctionIcon } from './catalog-icon';
import type { CatalogFunctionGradation } from './function-catalog-gradation';
import { FunctionCatalogGradationChips } from './function-catalog-gradation-chips';
import {
  CATALOG_ICON_COMPACT_SIZE_PX,
  FUNCTION_CATALOG_SELECTED_CARD_CLASS,
} from './function-catalog.constants';

const REMOVE_ICON_SIZE_PX = 16;

type FunctionCatalogCardProps = {
  item: DeliveryFunctionOperationalDto;
  statusLabel?: string;
  showStatus?: boolean;
  variant?: 'default' | 'compact';
  unitsLabel?: string;
  salePriceLabel?: string;
  unpublishedLabel?: string;
  extraLabel?: string;
  alreadyAdded?: boolean;
  alreadyAddedLabel?: string;
  selected?: boolean;
  selectable?: boolean;
  onOpen?: (id: string) => void;
  onToggle?: (id: string) => void;
  onRemove?: () => void;
  removeLabel?: string;
  gradations?: readonly CatalogFunctionGradation[];
  selectedTierId?: string;
  chooseVolumeLabel?: string;
  onSelectGradation?: (functionId: string, tierId: string) => void;
};

/** Emerald surface is only for the current selection, not “already on the product”. */
export function catalogCardUsesSelectedSurface(selected: boolean): boolean {
  return selected;
}

export function FunctionCatalogCard(props: FunctionCatalogCardProps) {
  const mode = catalogCardMode(props);
  const body = <CardContents item={props.item} compact={mode.compact} {...cardCopy(props)} />;
  return <CatalogCardSurface props={props} mode={mode} body={body} />;
}

function catalogCardMode(props: FunctionCatalogCardProps) {
  const compact = (props.variant ?? 'default') === 'compact';
  const alreadyAdded = props.alreadyAdded === true;
  const selected = props.selected === true;
  const canToggle = Boolean(props.onToggle) && props.selectable !== false && !alreadyAdded;
  const canChangeVolume =
    (props.gradations?.length ?? 0) > 0 &&
    Boolean(props.onSelectGradation) &&
    (canToggle || (alreadyAdded && selected));
  return {
    compact,
    selected,
    canToggle,
    canChangeVolume,
    className: cardClassName(
      compact,
      canToggle || Boolean(props.onOpen) || Boolean(props.onRemove),
      catalogCardUsesSelectedSurface(selected),
      canChangeVolume,
    ),
  };
}

function CatalogCardSurface({
  props,
  mode,
  body,
}: {
  props: FunctionCatalogCardProps;
  mode: ReturnType<typeof catalogCardMode>;
  body: ReactNode;
}) {
  if (props.onRemove) {
    return (
      <RemovableCatalogCard
        className={mode.className}
        body={body}
        removeLabel={props.removeLabel ?? ''}
        onRemove={props.onRemove}
      />
    );
  }
  if (mode.canChangeVolume && props.onSelectGradation) {
    return (
      <GradationCatalogCard
        itemId={props.item.id}
        selected={mode.selected}
        compact={mode.compact}
        className={mode.className}
        body={body}
        gradations={props.gradations ?? []}
        selectedTierId={props.selectedTierId}
        chooseVolumeLabel={props.chooseVolumeLabel ?? ''}
        onToggle={mode.canToggle ? props.onToggle : undefined}
        onSelectGradation={props.onSelectGradation}
      />
    );
  }
  return (
    <button
      type="button"
      disabled={Boolean(props.onToggle) && !mode.canToggle}
      aria-pressed={props.onToggle ? mode.selected : undefined}
      onClick={() => {
        if (mode.canToggle && props.onToggle) props.onToggle(props.item.id);
        else props.onOpen?.(props.item.id);
      }}
      className={mode.className}
    >
      {body}
    </button>
  );
}

type CardCopy = {
  showStatus: boolean;
  statusLabel: string;
  unitsLabel?: string;
  salePriceLabel?: string;
  unpublishedLabel?: string;
  extraLabel?: string;
  alreadyAdded: boolean;
  alreadyAddedLabel?: string;
  selected: boolean;
};

function cardCopy(props: FunctionCatalogCardProps): CardCopy {
  return {
    showStatus: props.showStatus === true,
    statusLabel: props.statusLabel ?? '',
    unitsLabel: props.unitsLabel,
    salePriceLabel: props.salePriceLabel,
    unpublishedLabel: props.unpublishedLabel,
    extraLabel: props.extraLabel,
    alreadyAdded: props.alreadyAdded === true,
    alreadyAddedLabel: props.alreadyAddedLabel,
    selected: props.selected === true,
  };
}

function RemovableCatalogCard({
  className,
  body,
  removeLabel,
  onRemove,
}: {
  className: string;
  body: ReactNode;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <div className={cn(className, 'items-start')}>
      {body}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={removeLabel}
        className="text-muted-foreground hover:text-destructive ml-auto shrink-0"
        onClick={onRemove}
      >
        <Minus size={REMOVE_ICON_SIZE_PX} />
      </Button>
    </div>
  );
}

function GradationCatalogCard({
  itemId,
  selected,
  compact,
  className,
  body,
  gradations,
  selectedTierId,
  chooseVolumeLabel,
  onToggle,
  onSelectGradation,
}: {
  itemId: string;
  selected: boolean;
  compact: boolean;
  className: string;
  body: ReactNode;
  gradations: readonly CatalogFunctionGradation[];
  selectedTierId?: string;
  chooseVolumeLabel: string;
  onToggle?: (id: string) => void;
  onSelectGradation: (functionId: string, tierId: string) => void;
}) {
  return (
    <div className={className}>
      <button
        type="button"
        aria-pressed={selected}
        disabled={!onToggle}
        onClick={() => onToggle?.(itemId)}
        className={cn('flex w-full min-w-0 text-left', compact ? 'gap-3' : 'flex-col gap-2')}
      >
        {body}
      </button>
      <FunctionCatalogGradationChips
        functionId={itemId}
        gradations={gradations}
        selectedTierId={selectedTierId}
        groupLabel={chooseVolumeLabel}
        onSelect={onSelectGradation}
      />
    </div>
  );
}

function cardClassName(
  compact: boolean,
  interactive: boolean,
  selected: boolean,
  stacked: boolean,
): string {
  return cn(
    'border-border bg-card flex h-full text-left transition-colors',
    compact ? 'gap-2 rounded-xl border p-2.5' : 'flex-col gap-1.5 rounded-xl border p-3',
    stacked && 'flex-col',
    interactive ? 'hover:bg-muted/40' : 'cursor-default opacity-70',
    selected && FUNCTION_CATALOG_SELECTED_CARD_CLASS,
  );
}

function CardContents({
  item,
  compact,
  ...copy
}: CardCopy & { item: DeliveryFunctionOperationalDto; compact: boolean }) {
  return (
    <>
      <span
        className={cn(
          'bg-muted flex shrink-0 items-center justify-center',
          compact ? 'size-8 rounded-md' : 'size-8 rounded-lg',
        )}
      >
        <CatalogFunctionIcon
          iconKey={item.iconKey}
          size={compact ? CATALOG_ICON_COMPACT_SIZE_PX : undefined}
        />
      </span>
      <CardBody item={item} compact={compact} {...copy} />
    </>
  );
}

function CardBody({
  item,
  compact,
  ...copy
}: CardCopy & { item: DeliveryFunctionOperationalDto; compact: boolean }) {
  return (
    <div className={cn('min-w-0', compact ? 'flex-1' : 'contents')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground line-clamp-2 min-h-10 text-sm font-semibold">{item.title}</p>
        <CardMeta {...copy} />
      </div>
    </div>
  );
}

function CardMeta({
  showStatus,
  statusLabel,
  unitsLabel,
  salePriceLabel,
  unpublishedLabel,
  extraLabel,
  alreadyAdded,
  alreadyAddedLabel,
  selected,
}: CardCopy) {
  const badge = extraLabel ?? (alreadyAdded || selected ? alreadyAddedLabel : undefined);
  if (
    !badge &&
    !showStatus &&
    unitsLabel === undefined &&
    salePriceLabel === undefined &&
    !unpublishedLabel
  ) {
    return null;
  }
  return (
    <span className="flex shrink-0 flex-col items-end gap-0.5">
      {badge ? <StatusBadge label={badge} variant={extraLabel ? 'violet' : 'emerald'} /> : null}
      {showStatus ? <span className="text-muted-foreground text-xs">{statusLabel}</span> : null}
      {salePriceLabel !== undefined ? (
        <span className="text-foreground text-xs font-medium tabular-nums">{salePriceLabel}</span>
      ) : null}
      {unpublishedLabel ? (
        <span className="text-muted-foreground text-xs">{unpublishedLabel}</span>
      ) : null}
      {unitsLabel !== undefined ? (
        <span className="text-muted-foreground text-xs tabular-nums">{unitsLabel}</span>
      ) : null}
    </span>
  );
}
