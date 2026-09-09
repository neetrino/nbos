import { CalendarDays, CheckSquare, Layers, Megaphone, Receipt, Repeat } from 'lucide-react';
import type { MobileDockItem } from './mobile-module-dock-types';

export function fallbackMobileDockItems(pathname: string): MobileDockItem[] {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return [
      {
        id: 'fallback:leads',
        label: 'Leads',
        href: '/crm/leads',
        icon: Megaphone,
        active: pathname.startsWith('/crm/leads'),
      },
      {
        id: 'fallback:tasks',
        label: 'Tasks',
        href: '/tasks',
        icon: CheckSquare,
        active: pathname.startsWith('/tasks'),
      },
      {
        id: 'fallback:invoices',
        label: 'Invoices',
        href: '/finance/invoices',
        icon: Receipt,
        active: pathname.startsWith('/finance/invoices'),
      },
      {
        id: 'fallback:calendar',
        label: 'Calendar',
        href: '/calendar',
        icon: CalendarDays,
        active: pathname.startsWith('/calendar'),
      },
    ];
  }

  if (pathname.startsWith('/tasks') || pathname.startsWith('/work-spaces')) {
    const onRecurring = pathname.startsWith('/tasks/recurring');
    const onSpaces = pathname.startsWith('/work-spaces');
    return [
      {
        id: 'fallback:task-board',
        label: 'Board',
        href: '/tasks',
        icon: CheckSquare,
        active: pathname.startsWith('/tasks') && !onRecurring,
      },
      {
        id: 'fallback:recurring',
        label: 'Recurring',
        href: '/tasks/recurring',
        icon: Repeat,
        active: onRecurring,
      },
      {
        id: 'fallback:spaces',
        label: 'Spaces',
        href: '/work-spaces',
        icon: Layers,
        active: onSpaces,
      },
    ];
  }

  return [];
}
