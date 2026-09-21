'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { FunctionCollectionDto } from '@/lib/api/delivery-catalog-structure';

export function DealConstructorCollections({
  collections,
  appliedCollectionId,
  disabled,
  onApply,
}: {
  collections: FunctionCollectionDto[];
  appliedCollectionId: string | null;
  disabled: boolean;
  onApply: (collectionId: string) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  if (collections.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('noCollections')}</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-foreground text-sm font-medium">{t('collections')}</p>
      <div className="flex flex-wrap gap-2">
        {collections.map((collection) => (
          <Button
            key={collection.id}
            type="button"
            size="sm"
            variant={appliedCollectionId === collection.id ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() => onApply(collection.id)}
          >
            {collection.name}
          </Button>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">{t('collectionsHint')}</p>
    </div>
  );
}
