'use client';

import { Layers } from 'lucide-react';
import { StatusBadge, type StatusVariant } from '@/components/shared';
import { CatalogFunctionIcon } from '@/features/function-catalog/catalog-icon';
import { CATALOG_ICON_COMPACT_SIZE_PX } from '@/features/function-catalog/function-catalog.constants';
import { COMPOSITION_LEVEL_CARD_CLASS } from './composition.constants';

export function CompositionLevelCard({
  title,
  note,
  iconKey,
  badge,
  badgeVariant,
}: {
  title: string;
  note?: string | null;
  iconKey?: string;
  badge: string;
  badgeVariant: StatusVariant;
}) {
  return (
    <div className={COMPOSITION_LEVEL_CARD_CLASS}>
      <LevelMark iconKey={iconKey} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground line-clamp-2 min-h-10 text-sm font-semibold">{title}</p>
        {note ? <p className="text-muted-foreground line-clamp-2 text-xs">{note}</p> : null}
      </div>
      <StatusBadge label={badge} variant={badgeVariant} />
    </div>
  );
}

function LevelMark({ iconKey }: { iconKey?: string }) {
  return (
    <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
      {iconKey ? (
        <CatalogFunctionIcon iconKey={iconKey} size={CATALOG_ICON_COMPACT_SIZE_PX} />
      ) : (
        <Layers size={CATALOG_ICON_COMPACT_SIZE_PX} aria-hidden className="text-foreground" />
      )}
    </span>
  );
}
