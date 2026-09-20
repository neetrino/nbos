import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { cn } from '@/lib/utils';
import { CatalogFunctionIcon } from './catalog-icon';
import {
  CATALOG_ICON_COMPACT_SIZE_PX,
  CATALOG_SUMMARY_CLAMP_CLASS,
} from './function-catalog.constants';

type FunctionCatalogCardProps = {
  item: DeliveryFunctionOperationalDto;
  statusLabel?: string;
  showStatus?: boolean;
  variant?: 'default' | 'compact';
  unitsLabel?: string;
  alreadyAdded?: boolean;
  alreadyAddedLabel?: string;
  selected?: boolean;
  selectable?: boolean;
  onOpen?: (id: string) => void;
  onToggle?: (id: string) => void;
};

export function FunctionCatalogCard({
  item,
  statusLabel = '',
  showStatus = false,
  variant = 'default',
  unitsLabel,
  alreadyAdded = false,
  alreadyAddedLabel,
  selected = false,
  selectable = true,
  onOpen,
  onToggle,
}: FunctionCatalogCardProps) {
  const compact = variant === 'compact';
  const canToggle = Boolean(onToggle) && selectable && !alreadyAdded;
  return (
    <button
      type="button"
      disabled={Boolean(onToggle) && !canToggle}
      aria-pressed={onToggle ? selected : undefined}
      onClick={() => {
        if (canToggle && onToggle) onToggle(item.id);
        else onOpen?.(item.id);
      }}
      className={cn(
        'border-border bg-card flex h-full text-left transition-colors',
        compact ? 'gap-3 rounded-xl border p-3' : 'flex-col gap-2 rounded-2xl border p-4',
        canToggle || onOpen ? 'hover:bg-muted/40' : 'cursor-default opacity-70',
        selected && 'border-primary bg-primary/5',
      )}
    >
      <span
        className={cn(
          'bg-muted flex shrink-0 items-center justify-center',
          compact ? 'size-9 rounded-lg' : 'size-10 rounded-xl',
        )}
      >
        <CatalogFunctionIcon
          iconKey={item.iconKey}
          size={compact ? CATALOG_ICON_COMPACT_SIZE_PX : undefined}
        />
      </span>
      <CardBody
        item={item}
        compact={compact}
        showStatus={showStatus}
        statusLabel={statusLabel}
        unitsLabel={unitsLabel}
        alreadyAdded={alreadyAdded}
        alreadyAddedLabel={alreadyAddedLabel}
      />
    </button>
  );
}

function CardBody({
  item,
  compact,
  showStatus,
  statusLabel,
  unitsLabel,
  alreadyAdded,
  alreadyAddedLabel,
}: {
  item: DeliveryFunctionOperationalDto;
  compact: boolean;
  showStatus: boolean;
  statusLabel: string;
  unitsLabel?: string;
  alreadyAdded: boolean;
  alreadyAddedLabel?: string;
}) {
  return (
    <div className={cn('min-w-0', compact ? 'flex-1' : 'contents')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground truncate text-sm font-semibold">{item.title}</p>
        <CardMeta
          showStatus={showStatus}
          statusLabel={statusLabel}
          unitsLabel={unitsLabel}
          alreadyAdded={alreadyAdded}
          alreadyAddedLabel={alreadyAddedLabel}
        />
      </div>
      <p className={cn('text-muted-foreground text-xs', CATALOG_SUMMARY_CLAMP_CLASS)}>
        {item.summary}
      </p>
    </div>
  );
}

function CardMeta({
  showStatus,
  statusLabel,
  unitsLabel,
  alreadyAdded,
  alreadyAddedLabel,
}: {
  showStatus: boolean;
  statusLabel: string;
  unitsLabel?: string;
  alreadyAdded: boolean;
  alreadyAddedLabel?: string;
}) {
  const hasAdded = alreadyAdded && Boolean(alreadyAddedLabel);
  if (!hasAdded && !showStatus && unitsLabel === undefined) return null;
  return (
    <span className="flex shrink-0 flex-col items-end gap-0.5">
      {hasAdded ? <span className="text-muted-foreground text-xs">{alreadyAddedLabel}</span> : null}
      {showStatus ? <span className="text-muted-foreground text-xs">{statusLabel}</span> : null}
      {unitsLabel !== undefined ? (
        <span className="text-muted-foreground text-xs tabular-nums">{unitsLabel}</span>
      ) : null}
    </span>
  );
}
