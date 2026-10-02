'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ADD_TO_COLLECTION_LABEL = 'Add to collection';

export function AddToCollectionSelect({
  collections,
  onAdd,
}: {
  collections: Array<{ id: string; name: string }>;
  onAdd: (collectionId: string) => void;
}) {
  if (collections.length === 0) return null;

  return (
    <Select
      value={null}
      onValueChange={(collectionId) => {
        if (collectionId) onAdd(collectionId);
      }}
    >
      <SelectTrigger size="sm" aria-label={ADD_TO_COLLECTION_LABEL} className="w-40 shrink-0">
        <SelectValue placeholder={ADD_TO_COLLECTION_LABEL} />
      </SelectTrigger>
      <SelectContent className="w-max max-w-64 min-w-(--anchor-width)">
        {collections.map((collection) => (
          <SelectItem key={collection.id} value={collection.id}>
            {collection.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
