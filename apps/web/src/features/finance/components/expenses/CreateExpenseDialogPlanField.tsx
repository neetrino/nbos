'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { useRelationPickerDropdownBox } from '@/components/shared/relation-picker/relation-picker-dropdown-position';
import { cn } from '@/lib/utils';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import {
  CREATE_EXPENSE_PLAN_NONE,
  PlanOptionsList,
  buildPlanOptions,
  filterPlanOptions,
} from './create-expense-dialog-plan-options';

export { CREATE_EXPENSE_PLAN_NONE };

interface CreateExpenseDialogPlanFieldProps {
  plans: ExpensePlan[];
  value: string;
  disabled?: boolean;
  onChange: (planId: string) => void;
}

function usePlanFieldDropdown(disabled: boolean) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const box = useRelationPickerDropdownBox(anchorRef, open && !disabled);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery('');
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const closeAndClear = () => {
    setOpen(false);
    setQuery('');
  };

  return {
    open,
    setOpen,
    query,
    setQuery,
    containerRef,
    panelRef,
    inputRef,
    anchorRef,
    box,
    closeAndClear,
  };
}

function PlanFieldSearchInput({
  inputRef,
  open,
  query,
  selectedLabel,
  noneLabel,
  searchPlaceholder,
  ariaLabel,
  disabled,
  onOpen,
  onQueryChange,
  onEscape,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  open: boolean;
  query: string;
  selectedLabel: string;
  noneLabel: string;
  searchPlaceholder: string;
  ariaLabel: string;
  disabled: boolean;
  onOpen: () => void;
  onQueryChange: (query: string) => void;
  onEscape: () => void;
}) {
  return (
    <Input
      ref={inputRef}
      value={open ? query : selectedLabel}
      disabled={disabled}
      aria-expanded={open}
      aria-label={ariaLabel}
      aria-autocomplete="list"
      role="combobox"
      placeholder={open ? searchPlaceholder : noneLabel}
      autoComplete="off"
      onMouseDown={() => {
        if (!disabled) onOpen();
      }}
      onFocus={() => {
        if (!disabled) onOpen();
      }}
      onChange={(event) => onQueryChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onEscape();
      }}
      className={cn(DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS, 'text-sm')}
    />
  );
}

export function CreateExpenseDialogPlanField({
  plans,
  value,
  disabled = false,
  onChange,
}: CreateExpenseDialogPlanFieldProps) {
  const t = useTranslations('forms');
  const {
    open,
    setOpen,
    query,
    setQuery,
    containerRef,
    panelRef,
    inputRef,
    anchorRef,
    box,
    closeAndClear,
  } = usePlanFieldDropdown(disabled);
  const noneLabel = t('expense.fields.planNone');
  const options = useMemo(() => buildPlanOptions(plans, noneLabel), [noneLabel, plans]);
  const selectedValue = value.trim() ? value : CREATE_EXPENSE_PLAN_NONE;
  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label ?? noneLabel;
  const filtered = useMemo(() => filterPlanOptions(options, query), [options, query]);

  return (
    <div
      ref={containerRef}
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{t('expense.fields.plan')}</span>
      <div
        ref={anchorRef}
        className={cn(DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS, 'relative gap-2 pr-2')}
      >
        <PlanFieldSearchInput
          inputRef={inputRef}
          open={open}
          query={query}
          selectedLabel={selectedLabel}
          noneLabel={noneLabel}
          searchPlaceholder={t('expense.fields.planSearch')}
          ariaLabel={t('expense.fields.planAria')}
          disabled={disabled}
          onOpen={() => {
            if (open) return;
            setOpen(true);
            setQuery('');
          }}
          onQueryChange={(nextQuery) => {
            setQuery(nextQuery);
            setOpen(true);
          }}
          onEscape={() => {
            closeAndClear();
            inputRef.current?.blur();
          }}
        />
        <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-80" aria-hidden />
      </div>
      {open && !disabled && box ? (
        <PlanOptionsList
          box={box}
          options={filtered}
          selectedValue={selectedValue}
          emptyLabel={t('expense.fields.planNoResults')}
          panelRef={panelRef}
          onSelect={(option) => {
            onChange(option.value === CREATE_EXPENSE_PLAN_NONE ? '' : option.value);
            closeAndClear();
          }}
        />
      ) : null}
    </div>
  );
}
