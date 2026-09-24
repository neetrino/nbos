'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TOOLBAR_ROW_CLASS } from './delivery-norms.constants';
import { DeliveryNormsListSearch } from './delivery-norms-list-search';

export function DeliveryNormsSectionToolbar({
  query,
  onQueryChange,
  searchLabel,
  searchPlaceholder,
  addLabel,
  canAdd = false,
  onAdd,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  addLabel?: string;
  canAdd?: boolean;
  onAdd?: () => void;
}) {
  return (
    <div className={TOOLBAR_ROW_CLASS}>
      <DeliveryNormsListSearch
        value={query}
        onChange={onQueryChange}
        label={searchLabel}
        placeholder={searchPlaceholder}
      />
      {canAdd && addLabel && onAdd ? (
        <Button type="button" size="sm" onClick={onAdd}>
          <Plus className="size-4" aria-hidden />
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
