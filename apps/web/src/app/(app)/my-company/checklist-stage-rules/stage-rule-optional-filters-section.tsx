'use client';

import { Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/features/projects/constants/projects';
import type { DeliveryChecklistTarget } from '@/lib/api/checklist-templates';
import { FILTER_ANY, SELECT_TRIGGER_FORM } from './delivery-stage-rule-options';
import { selectOptionLabel } from './stage-rules-select-helpers';

type Props = {
  target: DeliveryChecklistTarget;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
};

function RuleFilterSelect({
  label,
  value,
  onChange,
  anyLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  anyLabel: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger className={SELECT_TRIGGER_FORM}>
          <SelectValue>
            {(current: string | null) => selectOptionLabel(current, options, FILTER_ANY) ?? null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ANY}>{anyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ProductOptionalFilters({
  filterCategory,
  setFilterCategory,
  filterType,
  setFilterType,
}: Omit<Props, 'target'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <RuleFilterSelect
        label="Product category"
        value={filterCategory}
        onChange={setFilterCategory}
        anyLabel="Any category"
        options={PRODUCT_CATEGORIES}
      />
      <RuleFilterSelect
        label="Product type"
        value={filterType}
        onChange={setFilterType}
        anyLabel="Any type"
        options={PRODUCT_TYPES}
      />
    </div>
  );
}

export function StageRuleOptionalFiltersSection({
  target,
  filterCategory,
  setFilterCategory,
  filterType,
  setFilterType,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        <Filter className="size-3.5" aria-hidden />
        Optional filters
      </div>
      {target === 'PRODUCT' ? (
        <ProductOptionalFilters
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterType={filterType}
          setFilterType={setFilterType}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          This rule applies to every extension in the chosen stage.
        </p>
      )}
      {target === 'PRODUCT' ? (
        <p className="text-muted-foreground text-xs">
          Leave filters open to &quot;Any&quot; to apply this checklist to every matching product in
          that stage.
        </p>
      ) : null}
    </div>
  );
}
