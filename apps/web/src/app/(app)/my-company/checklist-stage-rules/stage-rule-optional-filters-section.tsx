'use client';

import { Filter } from 'lucide-react';
import { InlineField } from '@/components/shared';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/features/projects/constants/projects';
import type { DeliveryChecklistTarget } from '@/lib/api/checklist-templates';
import { FILTER_ANY } from './delivery-stage-rule-options';

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
    <InlineField
      variant="controlled"
      type="select"
      label={label}
      value={value}
      options={[{ value: FILTER_ANY, label: anyLabel }, ...options]}
      onValueChange={onChange}
    />
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
