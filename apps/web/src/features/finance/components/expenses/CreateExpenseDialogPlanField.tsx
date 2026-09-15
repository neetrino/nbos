'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import type { ExpensePlan } from '@/lib/api/expense-plans';

export const CREATE_EXPENSE_PLAN_NONE = 'none';

interface PlanOption {
  value: string;
  label: string;
}

interface CreateExpenseDialogPlanFieldProps {
  plans: ExpensePlan[];
  value: string;
  disabled?: boolean;
  onChange: (planId: string) => void;
}

function buildPlanOptions(plans: ExpensePlan[], noneLabel: string): PlanOption[] {
  return [
    { value: CREATE_EXPENSE_PLAN_NONE, label: noneLabel },
    ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
  ];
}

function filterPlanOptions(options: PlanOption[], query: string): PlanOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return options;
  return options.filter((option) => option.label.toLowerCase().includes(needle));
}

function PlanOptionsList({
  options,
  selectedValue,
  emptyLabel,
  onSelect,
}: {
  options: PlanOption[];
  selectedValue: string;
  emptyLabel: string;
  onSelect: (option: PlanOption) => void;
}) {
  if (options.length === 0) {
    return (
      <ul
        role="listbox"
        className="border-border bg-popover absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border p-1.5 shadow-lg"
      >
        <li className="text-muted-foreground px-3 py-2 text-sm">{emptyLabel}</li>
      </ul>
    );
  }

  return (
    <ul
      role="listbox"
      className="border-border bg-popover absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border p-1.5 shadow-lg"
    >
      {options.map((option) => {
        const selected = option.value === selectedValue;
        return (
          <li key={option.value} role="option" aria-selected={selected}>
            <button
              type="button"
              className={cn(
                'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                selected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/90 hover:bg-muted',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(option)}
            >
              {option.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CreateExpenseDialogPlanField({
  plans,
  value,
  disabled = false,
  onChange,
}: CreateExpenseDialogPlanFieldProps) {
  const t = useTranslations('forms');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const noneLabel = t('expense.fields.planNone');
  const options = useMemo(() => buildPlanOptions(plans, noneLabel), [noneLabel, plans]);
  const selectedValue = value.trim() ? value : CREATE_EXPENSE_PLAN_NONE;
  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label ?? noneLabel;
  const filtered = useMemo(() => filterPlanOptions(options, query), [options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const closeAndClear = () => {
    setOpen(false);
    setQuery('');
  };

  const selectOption = (option: PlanOption) => {
    onChange(option.value === CREATE_EXPENSE_PLAN_NONE ? '' : option.value);
    closeAndClear();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{t('expense.fields.plan')}</span>
      <div className={cn(DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS, 'relative gap-2 pr-2')}>
        <Input
          ref={inputRef}
          value={open ? query : selectedLabel}
          disabled={disabled}
          aria-expanded={open}
          aria-label={t('expense.fields.planAria')}
          aria-autocomplete="list"
          role="combobox"
          placeholder={open ? t('expense.fields.planSearch') : noneLabel}
          autoComplete="off"
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            setQuery('');
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return;
            closeAndClear();
            inputRef.current?.blur();
          }}
          className={cn(DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS, 'text-sm')}
        />
        <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-80" aria-hidden />
      </div>
      {open && !disabled ? (
        <PlanOptionsList
          options={filtered}
          selectedValue={selectedValue}
          emptyLabel={t('expense.fields.planNoResults')}
          onSelect={selectOption}
        />
      ) : null}
    </div>
  );
}
