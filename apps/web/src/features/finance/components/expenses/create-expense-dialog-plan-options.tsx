'use client';

import type { CSSProperties, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { PORTAL_DROPDOWN_Z_CLASS } from '@/lib/overlay-z-index';
import type { RelationPickerDropdownBox } from '@/components/shared/relation-picker/relation-picker-dropdown-position';

export const CREATE_EXPENSE_PLAN_NONE = 'none';

export const PLAN_OPTIONS_PREFERRED_MAX_HEIGHT_PX = 288;

const PLAN_OPTIONS_PANEL_CLASS = [
  'border-border bg-popover/95 text-popover-foreground fixed overflow-y-auto rounded-xl border p-1.5',
  'ring-border/40 shadow-xl ring-1 shadow-black/[0.08] backdrop-blur-md',
  'supports-[backdrop-filter]:bg-popover/85',
  PORTAL_DROPDOWN_Z_CLASS,
].join(' ');

export interface PlanOption {
  value: string;
  label: string;
}

export function buildPlanOptions(
  plans: { id: string; name: string }[],
  noneLabel: string,
): PlanOption[] {
  return [
    { value: CREATE_EXPENSE_PLAN_NONE, label: noneLabel },
    ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
  ];
}

export function filterPlanOptions(options: PlanOption[], query: string): PlanOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return options;
  return options.filter((option) => option.label.toLowerCase().includes(needle));
}

function PlanOptionButton({
  option,
  selected,
  onSelect,
}: {
  option: PlanOption;
  selected: boolean;
  onSelect: (option: PlanOption) => void;
}) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        className={cn(
          'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
          selected ? 'bg-primary text-primary-foreground' : 'text-foreground/90 hover:bg-muted',
        )}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onSelect(option)}
      >
        {option.label}
      </button>
    </li>
  );
}

export function PlanOptionsList({
  box,
  options,
  selectedValue,
  emptyLabel,
  panelRef,
  onSelect,
}: {
  box: RelationPickerDropdownBox;
  options: PlanOption[];
  selectedValue: string;
  emptyLabel: string;
  panelRef: RefObject<HTMLUListElement | null>;
  onSelect: (option: PlanOption) => void;
}) {
  if (typeof document === 'undefined') return null;

  const boxStyle: CSSProperties = {
    top: box.top,
    left: box.left,
    width: box.width,
    maxHeight: Math.min(box.maxHeight, PLAN_OPTIONS_PREFERRED_MAX_HEIGHT_PX),
  };

  return createPortal(
    <ul
      ref={panelRef}
      role="listbox"
      className={PLAN_OPTIONS_PANEL_CLASS}
      style={boxStyle}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {options.length === 0 ? (
        <li className="text-muted-foreground px-3 py-2 text-sm">{emptyLabel}</li>
      ) : (
        options.map((option) => (
          <PlanOptionButton
            key={option.value}
            option={option}
            selected={option.value === selectedValue}
            onSelect={onSelect}
          />
        ))
      )}
    </ul>,
    document.body,
  );
}
