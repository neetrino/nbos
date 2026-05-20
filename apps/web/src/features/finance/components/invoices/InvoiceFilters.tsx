import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/shared';
import { INVOICE_MONEY_STAGES, INVOICE_TYPES } from '@/features/finance/constants/finance';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';

interface InvoiceFiltersProps {
  search: string;
  filters: Record<string, string>;
  onSearchChange: (search: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onCreateInvoice: () => void;
}

const FILTER_CONFIGS = [
  {
    key: 'boardScope',
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  },
  {
    key: 'moneyStatus',
    label: 'Money status',
    options: INVOICE_MONEY_STAGES.map((stage) => ({ value: stage.value, label: stage.label })),
  },
  {
    key: 'type',
    label: 'Type',
    options: INVOICE_TYPES.map((type) => ({ value: type.value, label: type.label })),
  },
];

export function InvoiceFilters({
  search,
  filters,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onCreateInvoice,
}: InvoiceFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by invoice, company, order, project…"
          filters={FILTER_CONFIGS}
          filterValues={{
            boardScope: filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
            ...filters,
          }}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />
      </div>
      <Button className="shrink-0" onClick={onCreateInvoice}>
        <Plus size={16} />
        New Invoice
      </Button>
    </div>
  );
}
