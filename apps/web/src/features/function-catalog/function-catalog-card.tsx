import type { ReactNode } from 'react';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { cn } from '@/lib/utils';
import { CatalogFunctionIcon } from './catalog-icon';
import type { CatalogFunctionGradation } from './function-catalog-gradation';
import { FunctionCatalogGradationChips } from './function-catalog-gradation-chips';
import { CATALOG_ICON_COMPACT_SIZE_PX } from './function-catalog.constants';

type FunctionCatalogCardProps = {
  item: DeliveryFunctionOperationalDto;
  statusLabel?: string;
  showStatus?: boolean;
  variant?: 'default' | 'compact';
  unitsLabel?: string;
  salePriceLabel?: string;
  unpublishedLabel?: string;
  alreadyAdded?: boolean;
  alreadyAddedLabel?: string;
  selected?: boolean;
  selectable?: boolean;
  onOpen?: (id: string) => void;
  onToggle?: (id: string) => void;
  gradations?: readonly CatalogFunctionGradation[];
  selectedTierId?: string;
  chooseVolumeLabel?: string;
  onSelectGradation?: (functionId: string, tierId: string) => void;
};

export function FunctionCatalogCard(props: FunctionCatalogCardProps) {
  const compact = (props.variant ?? 'default') === 'compact';
  const alreadyAdded = props.alreadyAdded === true;
  const canToggle = Boolean(props.onToggle) && props.selectable !== false && !alreadyAdded;
  const showGradations =
    (props.gradations?.length ?? 0) > 0 && Boolean(props.onSelectGradation) && canToggle;
  const className = cardClassName(
    compact,
    canToggle || Boolean(props.onOpen),
    props.selected === true,
    showGradations,
  );
  const body = <CardContents item={props.item} compact={compact} {...cardCopy(props)} />;
  if (showGradations && props.onSelectGradation) {
    return (
      <GradationCatalogCard
        itemId={props.item.id}
        selected={props.selected === true}
        compact={compact}
        className={className}
        body={body}
        gradations={props.gradations ?? []}
        selectedTierId={props.selectedTierId}
        chooseVolumeLabel={props.chooseVolumeLabel ?? ''}
        onToggle={props.onToggle}
        onSelectGradation={props.onSelectGradation}
      />
    );
  }
  return (
    <button
      type="button"
      disabled={Boolean(props.onToggle) && !canToggle}
      aria-pressed={props.onToggle ? props.selected : undefined}
      onClick={() => {
        if (canToggle && props.onToggle) props.onToggle(props.item.id);
        else props.onOpen?.(props.item.id);
      }}
      className={className}
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
  alreadyAdded: boolean;
  alreadyAddedLabel?: string;
};

function cardCopy(props: FunctionCatalogCardProps): CardCopy {
  return {
    showStatus: props.showStatus === true,
    statusLabel: props.statusLabel ?? '',
    unitsLabel: props.unitsLabel,
    salePriceLabel: props.salePriceLabel,
    unpublishedLabel: props.unpublishedLabel,
    alreadyAdded: props.alreadyAdded === true,
    alreadyAddedLabel: props.alreadyAddedLabel,
  };
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
    selected && 'border-primary bg-primary/5',
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
        <p className="text-foreground truncate text-sm font-semibold">{item.title}</p>
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
  alreadyAdded,
  alreadyAddedLabel,
}: CardCopy) {
  const hasAdded = alreadyAdded && Boolean(alreadyAddedLabel);
  if (!hasAdded && !showStatus && unitsLabel === undefined && salePriceLabel === undefined) {
    return null;
  }
  return (
    <span className="flex shrink-0 flex-col items-end gap-0.5">
      {hasAdded ? <span className="text-muted-foreground text-xs">{alreadyAddedLabel}</span> : null}
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
