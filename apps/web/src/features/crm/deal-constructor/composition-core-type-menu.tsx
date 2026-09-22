'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CodeProductTypeOptionGrid,
  useCodeProductTypePickerState,
} from '../components/code-product-type-picker/code-product-type-picker';
import { CODE_PRODUCT_TYPE_POPOVER_CLASS } from '../components/code-product-type-picker/code-product-type-picker.constants';
import type { CodeProductTypeOption } from '../components/code-product-type-picker/code-product-type-picker.types';
import { COMPOSITION_CORE_TYPE_TRIGGER_CLASS } from './composition.constants';

export type CompositionProductTypeChange = {
  value: string;
  options: readonly CodeProductTypeOption[];
  disabled: boolean;
  onChange: (value: string) => void;
};

export function CompositionCoreTypeMenu({
  change,
  children,
}: {
  change: CompositionProductTypeChange;
  children: ReactNode;
}) {
  const t = useTranslations('crm');
  const picker = useCodeProductTypePickerState(
    change.options,
    change.value,
    change.disabled,
    change.onChange,
  );
  return (
    <Popover open={picker.open} onOpenChange={picker.onOpenChange}>
      <PopoverTrigger disabled={change.disabled} className={COMPOSITION_CORE_TYPE_TRIGGER_CLASS}>
        {children}
      </PopoverTrigger>
      <CoreTypeMenuPanel
        query={picker.query}
        onQueryChange={picker.setQuery}
        searchPlaceholder={t('dealSheet.searchProductType')}
        options={picker.filtered}
        selectedValue={change.value}
        emptyLabel={t('dealSheet.emptyProductTypeSearch')}
        onSelect={picker.select}
      />
    </Popover>
  );
}

function CoreTypeMenuPanel({
  query,
  onQueryChange,
  searchPlaceholder,
  options,
  selectedValue,
  emptyLabel,
  onSelect,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  searchPlaceholder: string;
  options: readonly CodeProductTypeOption[];
  selectedValue: string;
  emptyLabel: string;
  onSelect: (value: string) => void;
}) {
  return (
    <PopoverContent align="start" className={CODE_PRODUCT_TYPE_POPOVER_CLASS}>
      <Input
        value={query}
        placeholder={searchPlaceholder}
        autoComplete="off"
        autoFocus
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <CodeProductTypeOptionGrid
        options={options}
        selectedValue={selectedValue}
        emptyLabel={emptyLabel}
        onSelect={onSelect}
      />
    </PopoverContent>
  );
}
