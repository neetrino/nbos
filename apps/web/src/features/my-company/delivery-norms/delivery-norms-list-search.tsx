'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import { LIST_SEARCH_MAX_CLASS } from './delivery-norms.constants';

export function DeliveryNormsListSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className={`relative ${LIST_SEARCH_MAX_CLASS}`}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        {...LIST_SEARCH_INPUT_PROPS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        role="searchbox"
        className="h-9 rounded-xl pl-9"
      />
    </div>
  );
}
