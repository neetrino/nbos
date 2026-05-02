'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ReportDefinition, SavedReportView } from '@/lib/api/reports';
import { reportsApi } from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';
import { buildReportFilters, savedViewToFilters, type ReportFilterState } from '../report-filters';

interface ReportFilterBarProps {
  definitions: ReportDefinition[];
  filters: ReportFilterState;
  search: string;
  savedViews: SavedReportView[];
  onFiltersChange: (filters: ReportFilterState) => void;
  onSearchChange: (search: string) => void;
  onSavedViewsChange: (views: SavedReportView[]) => void;
}

export function ReportFilterBar({
  definitions,
  filters,
  search,
  savedViews,
  onFiltersChange,
  onSearchChange,
  onSavedViewsChange,
}: ReportFilterBarProps) {
  const defaultReportKey = definitions[0]?.key ?? '';
  const [reportKey, setReportKey] = useState(defaultReportKey);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedReportKey = reportKey || defaultReportKey;
  const selectedDefinition = definitions.find((definition) => definition.key === selectedReportKey);

  async function saveView() {
    if (!selectedDefinition || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const view = await reportsApi.createSavedView({
        reportKey: selectedDefinition.key,
        ownerModule: selectedDefinition.ownerModule,
        name: name.trim(),
        filters: buildReportFilters(filters),
      });
      onSavedViewsChange([view, ...savedViews.filter((item) => item.id !== view.id)]);
      setName('');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Saved report view could not be created.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_160px_160px_160px]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search reports, audience, definitions..."
            className="pl-9"
          />
        </div>
        <DateInput
          label="Period from"
          value={filters.dateFrom}
          onChange={(dateFrom) => onFiltersChange({ ...filters, dateFrom })}
        />
        <DateInput
          label="Period to"
          value={filters.dateTo}
          onChange={(dateTo) => onFiltersChange({ ...filters, dateTo })}
        />
        <DateInput
          label="As of"
          value={filters.asOf}
          onChange={(asOf) => onFiltersChange({ ...filters, asOf })}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Saved view name"
        />
        <select
          value={selectedReportKey}
          onChange={(event) => setReportKey(event.target.value)}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
        >
          {definitions.map((definition) => (
            <option key={definition.key} value={definition.key}>
              {definition.title}
            </option>
          ))}
        </select>
        <select
          value=""
          onChange={(event) => {
            const view = savedViews.find((item) => item.id === event.target.value);
            if (view) onFiltersChange(savedViewToFilters(view));
          }}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Apply saved view</option>
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          disabled={!selectedDefinition || !name.trim() || saving}
          onClick={() => void saveView()}
        >
          {saving ? 'Saving...' : 'Save view'}
        </Button>
      </div>
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-muted-foreground text-xs font-medium">
      {label}
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1"
      />
    </label>
  );
}
