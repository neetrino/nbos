'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegratedSearchFilters, PageHero, ViewModeSwitch } from '@/components/shared';
import { SUPPORT_TICKET_FILTER_CONFIGS } from '@/features/support/constants/support-ticket-filter-configs';
import {
  SUPPORT_PAGE_VIEW_OPTIONS,
  type SupportPageViewMode,
} from '@/features/support/constants/support-page-view-options';
import { SupportPageSettingsSheet } from '@/features/support/components/SupportPageSettingsSheet';

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
  return (
    <>
      <PageHero
        title="Support"
        search={
          <IntegratedSearchFilters
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search tickets, project code, project name, product…"
            filters={SUPPORT_TICKET_FILTER_CONFIGS}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            onClearAll={onClearFilters}
          />
        }
        viewMode={
          <ViewModeSwitch
            value={view}
            onChange={onViewChange}
            options={SUPPORT_PAGE_VIEW_OPTIONS}
          />
        }
        trailing={
          <>
            <SupportPageSettingsSheet
              exportDisabled={exportDisabled}
              onExportScopeStatsCsv={onExportScopeStatsCsv}
            />
            <Button type="button" onClick={onNewTicket}>
              <Plus size={16} aria-hidden />
              New Ticket
            </Button>
          </>
        }
      />
      <p className="text-muted-foreground text-sm">
        Track incidents, SLAs, and project-linked support work.
      </p>
    </>
  );
}
