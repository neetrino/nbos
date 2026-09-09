import { CheckSquare, Layers, Repeat } from 'lucide-react';
import type { MobileDockItem } from './mobile-module-dock-types';

/** Tasks has no PageHero section links; Board / Recurring / Spaces are the module map. */
export function fallbackMobileDockItems(pathname: string): MobileDockItem[] {
  if (!pathname.startsWith('/tasks') && !pathname.startsWith('/work-spaces')) {
    return [];
  }

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
