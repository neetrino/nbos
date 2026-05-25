'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { BookmarkPlus, CalendarRange, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
import type { ReportDefinition, SavedReportView } from '@/lib/api/reports';
import { reportsApi } from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import { buildReportFilters, savedViewToFilters, type ReportFilterState } from '../report-filters';

type PeriodPreset = 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR';
type PeriodMode = PeriodPreset | 'CUSTOM';

const PERIOD_PRESETS: Array<{ id: PeriodPreset; label: string }> = [
  { id: 'THIS_MONTH', label: 'Month' },
  { id: 'THIS_QUARTER', label: 'Quarter' },
  { id: 'THIS_YEAR', label: 'Year' },
];

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
  const [periodMode, setPeriodMode] = useState<PeriodMode>('THIS_MONTH');
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(filters.dateFrom);
  const [customTo, setCustomTo] = useState(filters.dateTo);
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

  function applyCustomRange() {
    const dateTo = customTo || customFrom || toDateInputValue(new Date());
    setPeriodMode('CUSTOM');
    setCustomOpen(false);
    onFiltersChange({
      dateFrom: customFrom,
      dateTo,
      asOf: dateTo,
    });
  }

  return (
    <div className="border-border/80 bg-card/95 rounded-2xl border p-3 shadow-sm">
      <div className="relative grid items-center gap-2 xl:grid-cols-[auto_minmax(220px,1fr)_auto_180px_170px_150px_76px]">
        <div className="text-muted-foreground flex h-9 items-center gap-2 pr-1 text-xs font-medium">
          <Filter size={14} />
          Filters
        </div>
        <SearchInput search={search} onSearchChange={onSearchChange} />
        <PeriodButtons
          activeMode={periodMode}
          onChange={(preset) => {
            setPeriodMode(preset);
            setCustomOpen(false);
            onFiltersChange(buildPresetFilters(preset));
          }}
          onCustomClick={() => {
            setPeriodMode('CUSTOM');
            setCustomOpen((current) => !current);
          }}
        />
        <SelectField value={selectedReportKey} onChange={setReportKey} ariaLabel="Report">
          {definitions.map((definition) => (
            <option key={definition.key} value={definition.key}>
              {definition.title}
            </option>
          ))}
        </SelectField>
        <SelectField
          value=""
          onChange={(viewId) => {
            const view = savedViews.find((item) => item.id === viewId);
            if (view) onFiltersChange(savedViewToFilters(view));
          }}
          ariaLabel="Saved view"
        >
          <option value="">Apply saved view</option>
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </SelectField>
        <div className="relative">
          <BookmarkPlus className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Save as..."
            className="bg-background/80 pl-9"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!selectedDefinition || !name.trim() || saving}
          onClick={() => void saveView()}
          className="h-9"
        >
          {saving ? '...' : 'Save'}
        </Button>
        {customOpen ? (
          <CustomRangePanel
            dateFrom={customFrom}
            dateTo={customTo}
            onDateFromChange={setCustomFrom}
            onDateToChange={setCustomTo}
            onApply={applyCustomRange}
          />
        ) : null}
      </div>
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
    </div>
  );
}

function SearchInput({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (search: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        {...LIST_SEARCH_INPUT_PROPS}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search reports..."
        role="searchbox"
        className="bg-background/80 pl-9"
      />
    </div>
  );
}

function PeriodButtons({
  activeMode,
  onChange,
  onCustomClick,
}: {
  activeMode: PeriodMode;
  onChange: (preset: PeriodPreset) => void;
  onCustomClick: () => void;
}) {
  return (
    <div className="bg-muted/60 flex h-9 items-center gap-1 rounded-xl p-1">
      {PERIOD_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
            activeMode === preset.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarRange size={13} />
          {preset.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onCustomClick}
        className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
          activeMode === 'CUSTOM'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <CalendarRange size={13} />
        Custom
      </button>
    </div>
  );
}

function CustomRangePanel({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
}: {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="border-border bg-popover absolute top-11 left-0 z-20 grid w-full gap-3 rounded-2xl border p-3 shadow-lg sm:w-96 sm:grid-cols-[1fr_1fr_auto]">
      <NbosDatePicker
        value={dateFrom}
        onChange={onDateFromChange}
        aria-label="Custom period start"
        className="bg-background"
      />
      <NbosDatePicker
        value={dateTo}
        onChange={onDateToChange}
        aria-label="Custom period end"
        className="bg-background"
      />
      <Button type="button" size="sm" onClick={onApply} disabled={!dateFrom && !dateTo}>
        Apply
      </Button>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-input bg-background/80 h-9 rounded-md border px-3 text-sm"
    >
      {children}
    </select>
  );
}

function buildPresetFilters(preset: PeriodPreset): ReportFilterState {
  const now = new Date();
  if (preset === 'THIS_QUARTER') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1);
    return dateRangeToFilters(start, now, now);
  }
  if (preset === 'THIS_YEAR') {
    const start = new Date(now.getFullYear(), 0, 1);
    return dateRangeToFilters(start, now, now);
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return dateRangeToFilters(start, now, now);
}

function dateRangeToFilters(start: Date, end: Date, asOf: Date): ReportFilterState {
  return {
    dateFrom: toDateInputValue(start),
    dateTo: toDateInputValue(end),
    asOf: toDateInputValue(asOf),
  };
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
