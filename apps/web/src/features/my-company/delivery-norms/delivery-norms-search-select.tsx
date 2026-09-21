'use client';

import { SearchField, type SearchOption } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { SEARCH_SELECT_MAX_RESULTS } from './delivery-norms.constants';
import { filterSearchOptions } from './matches-norm-search';

export function DeliveryNormsSearchSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly SearchOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <SearchField
      className={FORM_FIELD_CELL_CLASS}
      label={label}
      value={value}
      displayValue={selected?.label}
      placeholder={placeholder}
      disabled={disabled}
      labelStyle="outlined"
      selectionMode="stage"
      maxResults={SEARCH_SELECT_MAX_RESULTS}
      onSearch={async (query) => filterSearchOptions(options, query, SEARCH_SELECT_MAX_RESULTS)}
      onStageSelect={(next) => onChange(next)}
      onClear={() => onChange(null)}
    />
  );
}
