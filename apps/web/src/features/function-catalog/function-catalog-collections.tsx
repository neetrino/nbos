'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PAGE_HERO_TAB_SCROLL } from '@/components/shared/page-hero/page-hero-constants';
import { cn } from '@/lib/utils';
import type { FunctionCollectionDto } from '@/lib/api/delivery-catalog-structure';
import { FUNCTION_CATALOG_COLLECTION_CHIP_CLASS } from './function-catalog.constants';

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
    <div className="flex min-w-0 items-center gap-2" aria-label={t('collections')}>
      <div className={cn(PAGE_HERO_TAB_SCROLL, 'min-w-0 flex-1')}>
        <div className="flex w-max flex-nowrap items-center gap-2">
          {collections.map((collection) => {
            const applied = collection.id === appliedCollectionId;
            return (
              <Button
                key={collection.id}
                type="button"
                size="sm"
                variant={applied ? 'default' : 'outline'}
                disabled={disabled}
                aria-pressed={applied}
                className={FUNCTION_CATALOG_COLLECTION_CHIP_CLASS}
                onClick={() => onApply(collection.id)}
              >
                {collection.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
