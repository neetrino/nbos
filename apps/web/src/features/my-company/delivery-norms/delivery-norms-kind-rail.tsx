'use client';

import { PICKER_LIST_CLASS } from './delivery-norms.constants';
import { DeliveryNormsListSearch } from './delivery-norms-list-search';
import { DeliveryNormsPickerRow } from './delivery-norms-picker-row';

export type DeliveryNormsKindOption = {
  id: string;
  title: string;
  subtitle?: string;
};

export function DeliveryNormsKindRail({
  options,
  selectedId,
  query,
  emptySearch,
  emptySearchLabel,
  searchLabel,
  searchPlaceholder,
  onQueryChange,
  onSelect,
}: {
  options: readonly DeliveryNormsKindOption[];
  selectedId: string | null;
  query: string;
  emptySearch: boolean;
  emptySearchLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <DeliveryNormsListSearch
        value={query}
        onChange={onQueryChange}
        label={searchLabel}
        placeholder={searchPlaceholder}
      />
      {emptySearch ? (
        <p className="text-muted-foreground text-sm">{emptySearchLabel}</p>
      ) : (
        <div className={PICKER_LIST_CLASS}>
          {options.map((option) => (
            <DeliveryNormsPickerRow
              key={option.id}
              title={option.title}
              subtitle={option.subtitle}
              active={option.id === selectedId}
              onSelect={() => onSelect(option.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
