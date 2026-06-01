import { CalendarRange, Columns3, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { ClientServicesViewMode } from '@/features/finance/constants/client-services-view';

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
