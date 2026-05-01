'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExpenseListSortField } from '@/lib/api/finance';
import { EXPENSE_LIST_SORT_OPTIONS } from './expense-list-sort-options';

interface ExpenseSortControlsProps {
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: ExpenseListSortField) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export function ExpenseSortControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: ExpenseSortControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs whitespace-nowrap">Sort</span>
      <Select
        value={sortBy}
        onValueChange={(v) => {
          if (v) onSortByChange(v as ExpenseListSortField);
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EXPENSE_LIST_SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={sortOrder}
        onValueChange={(v) => {
          if (v === 'asc' || v === 'desc') onSortOrderChange(v);
        }}
      >
        <SelectTrigger className="w-[128px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Descending</SelectItem>
          <SelectItem value="asc">Ascending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
