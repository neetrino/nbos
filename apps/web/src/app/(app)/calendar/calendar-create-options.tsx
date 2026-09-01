import { CalendarPlus, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarCreateKind } from './calendar-ui-constants';

export interface CalendarCreateOptionConfig {
  kind: CalendarCreateKind;
  menuTitle: string;
  heroLabel: string;
  icon: LucideIcon;
  toneClass: string;
  heroButtonClass: string;
  heroIconClass: string;
}

export const CALENDAR_CREATE_OPTIONS: CalendarCreateOptionConfig[] = [
  {
    kind: 'meeting',
    menuTitle: 'Meeting',
    heroLabel: 'New meeting',
    icon: Users,
    toneClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    heroButtonClass:
      'border-blue-500/20 bg-blue-500/[0.07] text-foreground hover:border-blue-500/30 hover:bg-blue-500/12',
    heroIconClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  },
  {
    kind: 'personal',
    menuTitle: 'Personal event',
    heroLabel: 'Personal event',
    icon: CalendarPlus,
    toneClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    heroButtonClass:
      'border-violet-500/20 bg-violet-500/[0.07] text-foreground hover:border-violet-500/30 hover:bg-violet-500/12',
    heroIconClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
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

export function CalendarCreateHeroButton({
  kind,
  onClick,
}: {
  kind: CalendarCreateKind;
  onClick: () => void;
}) {
  const option = getCalendarCreateOption(kind);
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex h-9 items-center gap-2 rounded-xl border px-2.5 text-sm font-medium shadow-sm transition-[background-color,border-color,box-shadow] duration-150 hover:shadow-md focus-visible:ring-3 focus-visible:outline-none',
        option.heroButtonClass,
      )}
    >
      <span
        className={cn('flex size-7 items-center justify-center rounded-lg', option.heroIconClass)}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      {option.heroLabel}
    </button>
  );
}
