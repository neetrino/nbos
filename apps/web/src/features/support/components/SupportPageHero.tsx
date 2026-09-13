'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegratedSearchFilters, useModuleHeroSlots, ViewModeSwitch } from '@/components/shared';
import { getSupportTicketFilterConfigs } from '@/features/support/constants/support-ticket-filter-configs';
import {
  getSupportPageViewOptions,
  type SupportPageViewMode,
} from '@/features/support/constants/support-page-view-options';
import { SupportPageSettingsSheet } from '@/features/support/components/SupportPageSettingsSheet';
import type { SupportTranslator } from '@/features/support/support-message-keys';

export interface SupportPageHeroProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  view: SupportPageViewMode;
  onViewChange: (mode: SupportPageViewMode) => void;
  exportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
  onNewTicket: () => void;
}

export function SupportPageHero({
  search,
  onSearchChange,
  filterValues,
  onFilterChange,
  onClearFilters,
  view,
  onViewChange,
  exportDisabled,
  onExportScopeStatsCsv,
  onNewTicket,
}: SupportPageHeroProps) {
  const t = useTranslations('support') as SupportTranslator;
  const filters = useMemo(() => getSupportTicketFilterConfigs(t), [t]);
  const viewOptions = useMemo(() => getSupportPageViewOptions(t), [t]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={t('searchPlaceholder')}
          filters={filters}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearFilters}
        />
      ),
      viewMode: <ViewModeSwitch value={view} onChange={onViewChange} options={viewOptions} />,
      trailing: (
        <>
          <SupportPageSettingsSheet
            exportDisabled={exportDisabled}
            onExportScopeStatsCsv={onExportScopeStatsCsv}
          />
          <Button type="button" onClick={onNewTicket}>
            <Plus size={16} aria-hidden />
            {t('newTicket')}
          </Button>
        </>
      ),
    }),
    [
      search,
      onSearchChange,
      filterValues,
      onFilterChange,
      onClearFilters,
      view,
      onViewChange,
      exportDisabled,
      onExportScopeStatsCsv,
      onNewTicket,
      filters,
      viewOptions,
      t,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return null;
}
