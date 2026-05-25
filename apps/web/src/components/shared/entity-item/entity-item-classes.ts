import { cn } from '@/lib/utils';
import type { EntityItemVariant } from './entity-item.types';

export const ENTITY_ITEM_LIST_GAP_CLASS = 'space-y-2';

export const ENTITY_ITEM_SURFACE_BASE_CLASS =
  'border-border bg-card hover:bg-muted/30 w-full text-left shadow-sm transition-all hover:shadow-md focus-visible:ring-ring outline-none focus-visible:ring-2';

export function entityItemSurfaceVariantClass(variant: EntityItemVariant): string {
  return variant === 'compact-card'
    ? cn(ENTITY_ITEM_SURFACE_BASE_CLASS, 'rounded-xl border px-3 py-2.5')
    : cn(ENTITY_ITEM_SURFACE_BASE_CLASS, 'flex min-w-0 items-center gap-3 rounded-xl border p-3');
}

export const ENTITY_ITEM_LEADING_ICON_WRAP_CLASS =
  'bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg';

export const ENTITY_ITEM_TITLE_CLASS = 'text-foreground truncate text-sm font-medium';

export const ENTITY_ITEM_SUBTITLE_CLASS =
  'text-muted-foreground mt-0.5 truncate text-[11px] leading-tight tracking-wide uppercase';

export const ENTITY_ITEM_METRIC_CLASS = 'text-foreground text-sm font-semibold tabular-nums';

export const ENTITY_ITEM_TRAILING_CLASS = 'text-muted-foreground shrink-0 text-xs';
