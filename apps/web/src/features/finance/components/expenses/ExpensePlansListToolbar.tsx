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
import { translateExpensePlanCategory, useExpensePlansT } from './expense-plan-message-keys';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES;

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
  const t = useExpensePlansT();

  const categorySelectItems = useMemo(
    () => [
      { value: 'ALL', label: t('filters.allCategories') },
      ...PLAN_CATEGORY_OPTIONS.map((c) => ({
        value: c.value,
        label: translateExpensePlanCategory(t, c.value, c.label),
      })),
    ],
    [t],
  );

  const projectSelectItems = useMemo(
    () => [
      { value: 'ALL', label: t('filters.allProjects') },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects, t],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex max-w-md min-w-[12rem] flex-1 flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium">{t('filters.search')}</span>
        <Input
          id="expense-plans-search"
          type="search"
          placeholder={t('page.searchPlaceholder')}
          value={searchDraft}
          onChange={(e) => onSearchDraftChange(e.target.value)}
          className={TOOLBAR_CONTROL_CLASS}
          aria-label={t('filters.searchAria')}
        />
      </div>
      <div className="flex min-w-[10rem] flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium">{t('filters.category')}</span>
        <Select
          value={category ?? 'ALL'}
          onValueChange={(v) => onCategoryChange(!v || v === 'ALL' ? '' : v)}
          items={categorySelectItems}
        >
          <SelectTrigger className={TOOLBAR_CONTROL_CLASS} aria-label={t('filters.categoryAria')}>
            <SelectValue placeholder={t('filters.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('filters.allCategories')}</SelectItem>
            {PLAN_CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {translateExpensePlanCategory(t, c.value, c.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-[12rem] flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium">{t('filters.project')}</span>
        <Select
          value={projectId ?? 'ALL'}
          onValueChange={(v) => onProjectIdChange(!v || v === 'ALL' ? '' : v)}
          disabled={projectsLoading}
          items={projectSelectItems}
        >
          <SelectTrigger className={TOOLBAR_CONTROL_CLASS} aria-label={t('filters.projectAria')}>
            <SelectValue
              placeholder={projectsLoading ? t('sheet.loading') : t('filters.allProjects')}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('filters.allProjects')}</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters ? (
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={onClearFilters}>
          {t('page.clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}
