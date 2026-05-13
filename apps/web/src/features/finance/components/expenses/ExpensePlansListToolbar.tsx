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
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import type { Project } from '@/lib/api/projects';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES.filter((c) => c.value !== 'OFFICE');

const TOOLBAR_CONTROL_CLASS =
  'border-input bg-card text-foreground focus:ring-ring h-9 rounded-md border px-2 text-sm focus:ring-2 focus:outline-none';

export function ExpensePlansListToolbar(props: {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  category: string | undefined;
  onCategoryChange: (value: string) => void;
  projectId: string | undefined;
  onProjectIdChange: (value: string) => void;
  projects: Project[];
  projectsLoading: boolean;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}) {
  const {
    searchDraft,
    onSearchDraftChange,
    category,
    onCategoryChange,
    projectId,
    onProjectIdChange,
    projects,
    projectsLoading,
    onClearFilters,
    hasActiveFilters,
  } = props;

  const categorySelectItems = useMemo(
    () => [
      { value: 'ALL', label: 'All categories' },
      ...PLAN_CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label })),
    ],
    [],
  );

  const projectSelectItems = useMemo(
    () => [
      { value: 'ALL', label: 'All projects' },
      ...projects.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    ],
    [projects],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex max-w-md min-w-[12rem] flex-1 flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium">Search</span>
        <Input
          id="expense-plans-search"
          type="search"
          placeholder="Name or provider"
          value={searchDraft}
          onChange={(e) => onSearchDraftChange(e.target.value)}
          className={TOOLBAR_CONTROL_CLASS}
          aria-label="Search expense plans by name or provider"
        />
      </div>
      <div className="flex min-w-[10rem] flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium">Category</span>
        <Select
          value={category ?? 'ALL'}
          onValueChange={(v) => onCategoryChange(!v || v === 'ALL' ? '' : v)}
          items={categorySelectItems}
        >
          <SelectTrigger className={TOOLBAR_CONTROL_CLASS} aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {PLAN_CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-[12rem] flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium">Project</span>
        <Select
          value={projectId ?? 'ALL'}
          onValueChange={(v) => onProjectIdChange(!v || v === 'ALL' ? '' : v)}
          disabled={projectsLoading}
          items={projectSelectItems}
        >
          <SelectTrigger className={TOOLBAR_CONTROL_CLASS} aria-label="Filter by project">
            <SelectValue placeholder={projectsLoading ? 'Loading…' : 'All projects'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.code} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters ? (
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={onClearFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
