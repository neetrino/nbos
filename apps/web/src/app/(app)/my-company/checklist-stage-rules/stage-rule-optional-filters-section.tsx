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
import {
  EXTENSION_SIZES,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from '@/features/projects/constants/projects';
import type { DeliveryChecklistTarget } from '@/lib/api/checklist-templates';
import { FILTER_ANY, SELECT_TRIGGER_FORM } from './delivery-stage-rule-options';
import { selectOptionLabel } from './stage-rules-select-helpers';

type Props = {
  target: DeliveryChecklistTarget;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterSize: string;
  setFilterSize: (v: string) => void;
};

export function StageRuleOptionalFiltersSection({
  target,
  filterCategory,
  setFilterCategory,
  filterType,
  setFilterType,
  filterSize,
  setFilterSize,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        <Filter className="size-3.5" aria-hidden />
        Optional filters
      </div>
      {target === 'PRODUCT' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Product category</Label>
            <Select
              value={filterCategory}
              onValueChange={(v) => {
                if (v) setFilterCategory(v);
              }}
            >
              <SelectTrigger className={SELECT_TRIGGER_FORM}>
                <SelectValue>
                  {(value: string | null) =>
                    selectOptionLabel(value, PRODUCT_CATEGORIES, FILTER_ANY) ?? null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ANY}>Any category</SelectItem>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Product type</Label>
            <Select
              value={filterType}
              onValueChange={(v) => {
                if (v) setFilterType(v);
              }}
            >
              <SelectTrigger className={SELECT_TRIGGER_FORM}>
                <SelectValue>
                  {(value: string | null) =>
                    selectOptionLabel(value, PRODUCT_TYPES, FILTER_ANY) ?? null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ANY}>Any type</SelectItem>
                {PRODUCT_TYPES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="max-w-md space-y-2">
          <Label>Extension size</Label>
          <Select
            value={filterSize}
            onValueChange={(v) => {
              if (v) setFilterSize(v);
            }}
          >
            <SelectTrigger className={SELECT_TRIGGER_FORM}>
              <SelectValue>
                {(value: string | null) =>
                  selectOptionLabel(value, EXTENSION_SIZES, FILTER_ANY) ?? null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ANY}>Any size</SelectItem>
              {EXTENSION_SIZES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        Leave filters open to &quot;Any&quot; to apply this checklist to every matching target in
        that stage.
      </p>
    </div>
  );
}
