import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/shared';
import { INVOICE_STAGES, INVOICE_TYPES } from '@/features/finance/constants/finance';

interface InvoiceFiltersProps {
  search: string;
  filters: Record<string, string>;
  onSearchChange: (search: string) => void;
  onFilterChange: (updater: (current: Record<string, string>) => Record<string, string>) => void;
  onCreateInvoice: () => void;
}

const FILTER_CONFIGS = [
  {
    key: 'status',
    label: 'Status',
    options: INVOICE_STAGES.map((stage) => ({ value: stage.value, label: stage.label })),
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
  onCreateInvoice,
}: InvoiceFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by invoice number, company..."
          filters={FILTER_CONFIGS}
          filterValues={filters}
          onFilterChange={(key, value) =>
            onFilterChange((current) => ({ ...current, [key]: value }))
          }
          onClearFilters={() => onFilterChange(() => ({}))}
        />
      </div>
      <Button className="shrink-0" onClick={onCreateInvoice}>
        <Plus size={16} />
        New Invoice
      </Button>
    </div>
  );
}
