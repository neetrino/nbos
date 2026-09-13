import { CalendarRange, Columns3, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { ClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import type { ClientServicesTranslate } from './client-service-message-keys';

/** English fallback for product-finance leftover until that hub is localized. */
export const CLIENT_SERVICES_VIEW_OPTIONS: ViewModeOption<ClientServicesViewMode>[] = [
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Client services table list',
  },
  {
    value: 'status',
    label: 'Status',
    icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Board by payment stage',
  },
  {
    value: 'months',
    label: 'Months',
    icon: <CalendarRange className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Board by renewal month across the year',
  },
];

export function buildClientServicesViewOptions(
  t: ClientServicesTranslate,
): ViewModeOption<ClientServicesViewMode>[] {
  return [
    {
      value: 'list',
      label: t('view.list'),
      icon: <List className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: t('view.listAria'),
    },
    {
      value: 'status',
      label: t('view.status'),
      icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: t('view.statusAria'),
    },
    {
      value: 'months',
      label: t('view.months'),
      icon: <CalendarRange className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: t('view.monthsAria'),
    },
  ];
}
