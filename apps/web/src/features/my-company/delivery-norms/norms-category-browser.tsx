'use client';

import type { ReactNode } from 'react';
import { PageHeroSearch } from '@/components/shared';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CategoryHeading } from '@/features/function-catalog/function-catalog-blocks';
import {
  FUNCTION_CATALOG_CARD_GRID_CLASS,
  FUNCTION_CATALOG_RAIL_GRID_CLASS,
} from '@/features/function-catalog/function-catalog.constants';

export type NormsRailEntry = {
  id: string;
  label: string;
  count: number;
};

export function NormsCountRail({
  title,
  entries,
  selectedId,
  onSelect,
}: {
  title: string;
  entries: readonly NormsRailEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="h-fit p-2">
      <p className="text-muted-foreground px-2 py-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </p>
      <div className="space-y-1">
        {entries.map((entry) => (
          <RailButton
            key={entry.id}
            entry={entry}
            selected={selectedId === entry.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Card>
  );
}

export function NormsCategoryBrowser<T>({
  railTitle,
  entries,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  searchPlaceholder,
  blocks,
  emptyLabel,
  itemKey,
  renderItem,
}: {
  railTitle: string;
  entries: readonly NormsRailEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  blocks: ReadonlyArray<{ id: string; label: string; items: readonly T[] }>;
  emptyLabel: string;
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <div className={FUNCTION_CATALOG_RAIL_GRID_CLASS}>
      <NormsCountRail
        title={railTitle}
        entries={entries}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <div className="min-w-0 space-y-4">
        <PageHeroSearch
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="w-full min-w-0"
        />
        <CategoryBlocks
          blocks={blocks}
          emptyLabel={emptyLabel}
          itemKey={itemKey}
          renderItem={renderItem}
        />
      </div>
    </div>
  );
}

function RailButton({
  entry,
  selected,
  onSelect,
}: {
  entry: NormsRailEntry;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'hover:bg-muted flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
        selected && 'bg-primary/10 text-primary font-medium',
      )}
      onClick={() => onSelect(entry.id)}
    >
      <span className="truncate">{entry.label}</span>
      <span className="text-muted-foreground text-xs">{entry.count}</span>
    </button>
  );
}

function CategoryBlocks<T>({
  blocks,
  emptyLabel,
  itemKey,
  renderItem,
}: {
  blocks: ReadonlyArray<{ id: string; label: string; items: readonly T[] }>;
  emptyLabel: string;
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}) {
  if (blocks.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <section key={block.id} className="space-y-3">
          <CategoryHeading label={block.label} />
          <div className={FUNCTION_CATALOG_CARD_GRID_CLASS}>
            {block.items.map((item) => (
              <div key={itemKey(item)}>{renderItem(item)}</div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
