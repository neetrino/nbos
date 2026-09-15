import { CalendarPlus, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarCreateKind } from './calendar-ui-constants';

export interface CalendarCreateOptionConfig {
  kind: CalendarCreateKind;
  menuTitle: string;
  icon: LucideIcon;
  toneClass: string;
}

export const CALENDAR_CREATE_OPTIONS: CalendarCreateOptionConfig[] = [
  {
    kind: 'meeting',
    menuTitle: 'Meeting',
    icon: Users,
    toneClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  {
    kind: 'personal',
    menuTitle: 'Personal event',
    icon: CalendarPlus,
    toneClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
];

export function getCalendarCreateOption(kind: CalendarCreateKind): CalendarCreateOptionConfig {
  const option = CALENDAR_CREATE_OPTIONS.find((item) => item.kind === kind);
  if (!option) throw new Error(`Unknown calendar create kind: ${kind}`);
  return option;
}

export function CalendarCreateKindIcon({
  kind,
  size = 'sm',
  className,
}: {
  kind: CalendarCreateKind;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const option = getCalendarCreateOption(kind);
  const Icon = option.icon;
  const isSmall = size === 'sm';

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg',
        isSmall ? 'size-7' : 'size-8',
        option.toneClass,
        className,
      )}
    >
      <Icon className={isSmall ? 'size-3.5' : 'size-4'} aria-hidden />
    </span>
  );
}
