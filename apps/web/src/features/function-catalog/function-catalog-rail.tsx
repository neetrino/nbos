'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS } from './function-catalog.constants';
import type { CatalogRailEntry, CatalogRailId } from './function-catalog-grouping';

export function FunctionCatalogRail({
  entries,
  selectedId,
  onSelect,
}: {
  entries: CatalogRailEntry[];
  selectedId: CatalogRailId;
  onSelect: (id: CatalogRailId) => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  return (
    <Card className="h-fit p-2">
      <p className="text-muted-foreground px-2 py-2 text-xs font-semibold tracking-wide uppercase">
        {t('categoriesRail')}
      </p>
      <div className="space-y-1">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={cn(
              'hover:bg-muted flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
              selectedId === entry.id && 'bg-primary/10 text-primary font-medium',
            )}
            onClick={() => onSelect(entry.id)}
          >
            <span className="truncate">{t(FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS[entry.id])}</span>
            <span className="text-muted-foreground text-xs">{entry.count}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
