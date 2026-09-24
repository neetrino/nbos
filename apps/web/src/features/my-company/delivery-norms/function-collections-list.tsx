'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FunctionCollectionDto } from '@/lib/api/delivery-catalog-structure';
import {
  COLLECTION_CHIPS_GRID_CLASS,
  PICKER_CHIP_ACTIVE_CLASS,
  PICKER_CHIP_CLASS,
} from './delivery-norms.constants';

export function FunctionCollectionsList({
  collections,
  selectedId,
  canCreate,
  onSelect,
  onCreate,
}: {
  collections: FunctionCollectionDto[];
  selectedId: string | null;
  canCreate: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className="space-y-3">
      <ul className={COLLECTION_CHIPS_GRID_CLASS}>
        {collections.map((collection) => (
          <li key={collection.id}>
            <button
              type="button"
              className={cn(
                PICKER_CHIP_CLASS,
                selectedId === collection.id ? PICKER_CHIP_ACTIVE_CLASS : null,
              )}
              onClick={() => onSelect(collection.id)}
            >
              <span className="text-foreground font-medium">{collection.name}</span>
              <span className="text-muted-foreground text-xs">
                {t('collections.selectedCount', { count: collection.functionIds.length })}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {canCreate ? (
        <Button type="button" size="sm" variant="outline" onClick={onCreate}>
          {t('collections.create')}
        </Button>
      ) : null}
    </div>
  );
}
