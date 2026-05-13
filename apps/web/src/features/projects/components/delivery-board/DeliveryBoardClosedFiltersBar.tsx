'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  ClosedDeadlineResultFilter,
  ClosedFilterOptions,
  DeliveryBoardClosedFiltersInput,
} from './delivery-board-closed-filters';

const CONTROL =
  'border-input bg-card text-foreground focus:ring-ring h-9 rounded-md border px-2 text-sm focus:ring-2 focus:outline-none';

export function DeliveryBoardClosedFiltersBar({
  value,
  onChange,
  options,
  onClear,
  hasActiveFilters,
}: {
  value: DeliveryBoardClosedFiltersInput;
  onChange: (next: DeliveryBoardClosedFiltersInput) => void;
  options: ClosedFilterOptions;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  const patch = (partial: Partial<DeliveryBoardClosedFiltersInput>) => {
    onChange({ ...value, ...partial });
  };

  const selectItems = useMemo(
    () => ({
      result: [
        { value: 'ALL', label: 'All results' },
        { value: 'DONE', label: 'Done' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ],
      projects: [
        { value: 'ALL', label: 'All projects' },
        ...options.projects.map((p) => ({ value: p.id, label: p.label })),
      ],
      companies: [
        { value: 'ALL', label: 'All companies' },
        ...options.companies.map((c) => ({ value: c.id, label: c.label })),
      ],
      owners: [
        { value: 'ALL', label: 'All owners' },
        ...options.owners.map((o) => ({ value: o.id, label: o.label })),
      ],
      productLines: [
        { value: 'ALL', label: 'All lines' },
        ...options.productLines.map((line) => ({ value: line.value, label: line.label })),
      ],
      deadlineResult: [
        { value: 'ALL', label: 'All (incl. extensions)' },
        { value: 'ON_TIME', label: 'On time (products)' },
        { value: 'LATE', label: 'Late (products)' },
      ],
    }),
    [options],
  );

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <p className="text-muted-foreground text-xs">
        Filters use list data (project + billing company from CRM). Archive: no drag between Done
        and Cancelled.
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex max-w-md min-w-[12rem] flex-1 flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Search</span>
          <Input
            type="search"
            placeholder="Name or project"
            value={value.search}
            onChange={(e) => patch({ search: e.target.value })}
            className={CONTROL}
            aria-label="Search closed items by name or project"
          />
        </div>
        <div className="flex min-w-[9rem] flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Result</span>
          <Select
            value={value.result}
            onValueChange={(v) => patch({ result: v as DeliveryBoardClosedFiltersInput['result'] })}
            items={selectItems.result}
          >
            <SelectTrigger className={CONTROL} size="sm" aria-label="Filter by result">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All results</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[11rem] flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Project</span>
          <Select
            value={value.projectId || 'ALL'}
            onValueChange={(v) => patch({ projectId: !v || v === 'ALL' ? '' : v })}
            items={selectItems.projects}
          >
            <SelectTrigger className={CONTROL} size="sm" aria-label="Filter by project">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All projects</SelectItem>
              {options.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[11rem] flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Company</span>
          <Select
            value={value.companyId || 'ALL'}
            onValueChange={(v) => patch({ companyId: !v || v === 'ALL' ? '' : v })}
            items={selectItems.companies}
          >
            <SelectTrigger className={CONTROL} size="sm" aria-label="Filter by billing company">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All companies</SelectItem>
              {options.companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[11rem] flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">PM / owner</span>
          <Select
            value={value.ownerId || 'ALL'}
            onValueChange={(v) => patch({ ownerId: !v || v === 'ALL' ? '' : v })}
            items={selectItems.owners}
          >
            <SelectTrigger className={CONTROL} size="sm" aria-label="Filter by PM or owner">
              <SelectValue placeholder="All owners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All owners</SelectItem>
              {options.owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[12rem] flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">
            Product / extension line
          </span>
          <Select
            value={value.productLineKey || 'ALL'}
            onValueChange={(v) => patch({ productLineKey: !v || v === 'ALL' ? '' : v })}
            items={selectItems.productLines}
          >
            <SelectTrigger
              className={CONTROL}
              size="sm"
              aria-label="Filter by product type or extension size"
            >
              <SelectValue placeholder="All lines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All lines</SelectItem>
              {options.productLines.map((line) => (
                <SelectItem key={line.value} value={line.value}>
                  {line.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[9rem] flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Closed from</span>
          <Input
            type="date"
            value={value.closedFrom}
            onChange={(e) => patch({ closedFrom: e.target.value })}
            className={CONTROL}
            aria-label="Closed on or after"
          />
        </div>
        <div className="flex min-w-[9rem] flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Closed to</span>
          <Input
            type="date"
            value={value.closedTo}
            onChange={(e) => patch({ closedTo: e.target.value })}
            className={CONTROL}
            aria-label="Closed on or before"
          />
        </div>
        <div className="flex min-w-[10rem] flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Deadline result</span>
          <Select
            value={value.deadlineResult}
            onValueChange={(v) => patch({ deadlineResult: v as ClosedDeadlineResultFilter })}
            items={selectItems.deadlineResult}
          >
            <SelectTrigger
              className={CONTROL}
              size="sm"
              aria-label="Filter by deadline vs close date"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All (incl. extensions)</SelectItem>
              <SelectItem value="ON_TIME">On time (products)</SelectItem>
              <SelectItem value="LATE">Late (products)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters ? (
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={onClear}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
