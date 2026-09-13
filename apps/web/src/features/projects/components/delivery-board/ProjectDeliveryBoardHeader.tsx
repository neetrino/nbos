'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SegmentedTabs } from '@/components/shared';
import { DeliveryBoardKindSegmented } from './DeliveryBoardKindSegmented';
import { translateDeliveryStatusFilter } from './delivery-board-message-keys';
import type {
  DeliveryBoardKindFilter,
  DeliveryBoardStatusFilter,
} from './project-delivery-board-model';

const STATUS_FILTER_VALUES: DeliveryBoardStatusFilter[] = ['ACTIVE', 'ON_HOLD', 'CLOSED', 'ALL'];

interface ProjectDeliveryBoardHeaderProps {
  activeCount: number;
  closedCount: number;
  kindFilter: DeliveryBoardKindFilter;
  statusFilter: DeliveryBoardStatusFilter;
  onKindFilterChange: (filter: DeliveryBoardKindFilter) => void;
  onStatusFilterChange: (filter: DeliveryBoardStatusFilter) => void;
  /** When set, status chips are hidden (global Active tab locks to active pipeline). */
  hideStatusFilters?: boolean;
}

export function ProjectDeliveryBoardHeader({
  activeCount,
  closedCount,
  kindFilter,
  statusFilter,
  onKindFilterChange,
  onStatusFilterChange,
  hideStatusFilters = false,
}: ProjectDeliveryBoardHeaderProps) {
  const t = useTranslations('deliveryBoard');
  const statusFilters = useMemo(
    () =>
      STATUS_FILTER_VALUES.map((value) => ({
        value,
        label: translateDeliveryStatusFilter(value, t),
      })),
    [t],
  );
  const toolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="bg-secondary rounded-full px-2 py-1 text-xs">
        {t('counts.active', { count: activeCount })}
      </span>
      <span className="bg-secondary rounded-full px-2 py-1 text-xs">
        {t('counts.closed', { count: closedCount })}
      </span>
      <DeliveryBoardKindSegmented value={kindFilter} onValueChange={onKindFilterChange} />
    </div>
  );

  return (
    <div className="space-y-3">
      {hideStatusFilters ? (
        toolbar
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{t('title')}</h2>
            <p className="text-muted-foreground text-xs">{t('header.description')}</p>
          </div>
          {toolbar}
        </div>
      )}
      {!hideStatusFilters ? (
        <SegmentedTabs
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={statusFilters}
          ariaLabel={t('header.statusAria')}
          className="w-fit"
          buttonClassName="px-3 py-2 text-xs"
        />
      ) : null}
    </div>
  );
}
