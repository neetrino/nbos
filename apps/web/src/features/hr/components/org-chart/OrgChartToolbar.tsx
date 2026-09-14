'use client';

import { List, Network, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PermissionGate } from '@/lib/permissions';
import { ORG_TOOLBAR_CLASS } from './org-chart-constants';

export type OrgChartViewMode = 'chart' | 'list';

export function OrgChartToolbar({
  viewMode,
  search,
  onSearchChange,
  onSearchSubmit,
  onViewModeChange,
  onAdd,
}: {
  viewMode: OrgChartViewMode;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onViewModeChange: (mode: OrgChartViewMode) => void;
  onAdd: () => void;
}) {
  const t = useTranslations('hr');
  return (
    <div className={ORG_TOOLBAR_CLASS}>
      <p className="text-foreground px-2 text-sm font-semibold whitespace-nowrap">
        {t('orgChart.title')}
      </p>
      <PermissionGate module="COMPANY" action="ADD">
        <Button type="button" size="sm" onClick={onAdd}>
          <Plus className="size-3.5" aria-hidden />
          {t('orgChart.add')}
        </Button>
      </PermissionGate>
      <Button
        type="button"
        size="icon-sm"
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        aria-label={t('orgChart.listView')}
        onClick={() => onViewModeChange(viewMode === 'list' ? 'chart' : 'list')}
      >
        {viewMode === 'list' ? <Network className="size-4" /> : <List className="size-4" />}
      </Button>
      <div className="relative min-w-40 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('orgChart.searchPlaceholder')}
          className="h-8 rounded-full pl-7 text-xs"
          aria-label={t('orgChart.search')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSearchSubmit();
          }}
        />
      </div>
    </div>
  );
}
