'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  DETAIL_SHEET_SELECT_TRIGGER_IN_SHELL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { CodeProductTypeCard } from './code-product-type-card';
import {
  CODE_PRODUCT_TYPE_CARD_GRID_CLASS,
  CODE_PRODUCT_TYPE_CHEVRON_SIZE_PX,
  CODE_PRODUCT_TYPE_CLEAR_ICON_SIZE_PX,
  CODE_PRODUCT_TYPE_LIST_CLASS,
  CODE_PRODUCT_TYPE_POPOVER_ALIGN,
  CODE_PRODUCT_TYPE_POPOVER_CLASS,
} from './code-product-type-picker.constants';
import type { CodeProductTypeOption } from './code-product-type-picker.types';
import { filterAndRankCodeProductTypes } from './filter-code-product-types';

type CodeProductTypePickerProps = {
  label: string;
  value: string;
  options: readonly CodeProductTypeOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  icon?: ReactNode;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  onValueChange: (value: string) => void;
};

export function CodeProductTypePicker({
  label,
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  icon,
  clearable = false,
  disabled = false,
  className,
  onValueChange,
}: CodeProductTypePickerProps) {
  const picker = useCodeProductTypePickerState(options, value, disabled, onValueChange);
  return (
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <span
        className={cn(
          DETAIL_SHEET_OUTLINED_LABEL_CLASS,
          icon && 'inline-flex items-center gap-0.5',
        )}
      >
        {label}
        {icon}
      </span>
      <Popover open={picker.open} onOpenChange={picker.onOpenChange}>
        <CodeProductTypeFieldTrigger
          label={label}
          displayLabel={picker.selected?.label ?? placeholder}
          empty={!picker.selected}
          clearable={clearable && Boolean(value) && !disabled}
          disabled={disabled}
          onClear={picker.clear}
        />
        <PopoverContent
          align={CODE_PRODUCT_TYPE_POPOVER_ALIGN}
          className={CODE_PRODUCT_TYPE_POPOVER_CLASS}
        >
          <Input
            value={picker.query}
            placeholder={searchPlaceholder}
            autoComplete="off"
            autoFocus
            onChange={(event) => picker.setQuery(event.target.value)}
          />
          <CodeProductTypeOptionGrid
            options={picker.filtered}
            selectedValue={value}
            emptyLabel={emptyLabel}
            onSelect={picker.select}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function useCodeProductTypePickerState(
  options: readonly CodeProductTypeOption[],
  value: string,
  disabled: boolean,
  onValueChange: (value: string) => void,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => filterAndRankCodeProductTypes(options, query), [options, query]);
  return {
    open,
    query,
    setQuery,
    selected,
    filtered,
    onOpenChange: (nextOpen: boolean) => {
      if (disabled) return;
      setOpen(nextOpen);
      if (!nextOpen) setQuery('');
    },
    select: (nextValue: string) => {
      onValueChange(nextValue);
      setOpen(false);
    },
    clear: () => {
      onValueChange('');
      setOpen(false);
    },
  };
}

function CodeProductTypeFieldTrigger({
  label,
  displayLabel,
  empty,
  clearable,
  disabled,
  onClear,
}: {
  label: string;
  displayLabel: string;
  empty: boolean;
  clearable: boolean;
  disabled: boolean;
  onClear: () => void;
}) {
  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          DETAIL_SHEET_SELECT_TRIGGER_IN_SHELL_CLASS,
          'flex w-full min-w-0 items-center justify-between gap-2 text-left',
          empty && 'text-muted-foreground',
        )}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <ChevronDown size={CODE_PRODUCT_TYPE_CHEVRON_SIZE_PX} className="shrink-0 opacity-70" />
      </PopoverTrigger>
      {clearable ? (
        <button
          type="button"
          className={DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS}
          aria-label={`Clear ${label}`}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={onClear}
        >
          <X size={CODE_PRODUCT_TYPE_CLEAR_ICON_SIZE_PX} />
        </button>
      ) : null}
    </div>
  );
}

export function CodeProductTypeOptionGrid({
  options,
  selectedValue,
  emptyLabel,
  onSelect,
}: {
  options: readonly CodeProductTypeOption[];
  selectedValue: string;
  emptyLabel: string;
  onSelect: (value: string) => void;
}) {
  if (options.length === 0) {
    return <p className="text-muted-foreground px-1 py-6 text-center text-sm">{emptyLabel}</p>;
  }
  return (
    <div className={CODE_PRODUCT_TYPE_LIST_CLASS}>
      <div className={CODE_PRODUCT_TYPE_CARD_GRID_CLASS}>
        {options.map((option) => (
          <CodeProductTypeCard
            key={option.value}
            option={option}
            selected={option.value === selectedValue}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
