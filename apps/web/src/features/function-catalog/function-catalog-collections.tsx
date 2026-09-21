'use client';

import { useTranslations } from 'next-intl';
import type { FunctionCollectionDto } from '@/lib/api/delivery-catalog-structure';
import { cn } from '@/lib/utils';
import { FUNCTION_CATALOG_COLLECTION_GRID_CLASS } from './function-catalog.constants';

export function FunctionCatalogCollections({
  collections,
  appliedCollectionId,
  disabled,
  onApply,
}: {
  collections: readonly FunctionCollectionDto[];
  appliedCollectionId: string | null;
  disabled: boolean;
  onApply: (collectionId: string) => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  if (collections.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-semibold">{t('collections')}</h3>
        <p className="text-muted-foreground text-xs">{t('collectionsHint')}</p>
      </div>
      <div className={FUNCTION_CATALOG_COLLECTION_GRID_CLASS}>
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            name={collection.name}
            applied={collection.id === appliedCollectionId}
            disabled={disabled}
            countLabel={t('collectionFunctionCount', { count: collection.functionIds.length })}
            onApply={() => onApply(collection.id)}
          />
        ))}
      </div>
    </section>
  );
}

function CollectionCard({
  name,
  applied,
  disabled,
  countLabel,
  onApply,
}: {
  name: string;
  applied: boolean;
  disabled: boolean;
  countLabel: string;
  onApply: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={applied}
      onClick={onApply}
      className={cn(
        'rounded-2xl border p-4 text-left transition-colors',
        applied ? 'border-foreground bg-muted/40' : 'border-border bg-card hover:bg-muted/30',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="text-foreground block text-sm font-semibold">{name}</span>
      <span className="text-muted-foreground mt-1 block text-xs">{countLabel}</span>
    </button>
  );
}
