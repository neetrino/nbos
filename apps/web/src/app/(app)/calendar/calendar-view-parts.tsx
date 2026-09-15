import { CalendarDays, Clock } from 'lucide-react';
import type { CalendarEventProjection } from '@/lib/api/calendar';
import { CalendarDayCreateMenu } from './calendar-day-create-menu';
import {
  CALENDAR_DAY_CELL_MIN_HEIGHT_CLASS,
  type CalendarCreateKind,
} from './calendar-ui-constants';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const LAYER_STYLES: Record<
  CalendarEventProjection['layer'],
  { dot: string; bg: string; text: string; badge: string; label: string }
> = {
  MEETINGS: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    label: 'Meeting',
  },
  DELIVERY_DEADLINES: {
    dot: 'bg-red-500',
    bg: 'bg-red-500/10 border-red-500/20',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-300',
    label: 'Delivery',
  },
  PERSONAL: {
    dot: 'bg-violet-500',
    bg: 'bg-violet-500/10 border-violet-500/20',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    label: 'Personal',
  },
};

function dayCellSurfaceClass(isSelected: boolean): string {
  return `group relative flex ${CALENDAR_DAY_CELL_MIN_HEIGHT_CLASS} flex-col items-start rounded-xl p-2 transition-colors ${
    isSelected ? 'bg-primary/5 ring-primary ring-1' : 'hover:bg-secondary'
  }`;
}

function DayCellEventDots({ events }: { events: CalendarEventProjection[] }) {
  if (events.length === 0) return null;
  return (
    <div className="mt-1 flex gap-1">
      {events.slice(0, 3).map((event) => (
        <div
          key={event.id}
          className={`h-1.5 w-1.5 rounded-full ${LAYER_STYLES[event.layer].dot}`}
        />
      ))}
      {events.length > 3 && (
        <span className="text-muted-foreground text-[10px] leading-none">+{events.length - 3}</span>
      )}
    </div>
  );
}

export function DayCell({
  date,
  events,
  isToday,
  isSelected,
  onSelect,
  onCreate,
}: {
  date: Date | null;
  events: CalendarEventProjection[];
  isToday: boolean;
  isSelected: boolean;
  onSelect: (date: Date) => void;
  onCreate: (date: Date, kind: CalendarCreateKind) => void;
}) {
  if (!date) return <div className={`${CALENDAR_DAY_CELL_MIN_HEIGHT_CLASS} rounded-xl p-2`} />;

  return (
    <div className={dayCellSurfaceClass(isSelected)}>
      <button
        type="button"
        onClick={() => onSelect(date)}
        aria-pressed={isSelected}
        aria-label={date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        className="absolute inset-0 z-0 rounded-xl"
      />
      <div className="pointer-events-none relative z-[1] flex flex-col items-start">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
            isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
          }`}
        >
          {date.getDate()}
        </span>
        <DayCellEventDots events={events} />
      </div>
      <CalendarDayCreateMenu
        date={date}
        persistVisible={isSelected}
        onSelectDate={onSelect}
        onCreate={onCreate}
      />
    </div>
  );
}

export function EventCard({
  event,
  onMeetingOrPersonalClick,
}: {
  event: CalendarEventProjection;
  onMeetingOrPersonalClick?: (event: CalendarEventProjection) => void;
}) {
  const style = LAYER_STYLES[event.layer];
  const surfaceClass = `border block w-full rounded-xl px-2.5 py-2 text-left ${style.bg}`;

  if (event.layer === 'DELIVERY_DEADLINES' && event.sourceHref) {
    return (
      <a href={event.sourceHref} className={surfaceClass}>
        <EventCardInner event={event} style={style} />
      </a>
    );
  }

  if (
    (event.layer === 'MEETINGS' || event.layer === 'PERSONAL') &&
    typeof onMeetingOrPersonalClick === 'function'
  ) {
    return (
      <button
        type="button"
        onClick={() => onMeetingOrPersonalClick(event)}
        className={`${surfaceClass} cursor-pointer hover:brightness-110`}
      >
        <EventCardInner event={event} style={style} />
      </button>
    );
  }

  return (
    <div className={surfaceClass}>
      <EventCardInner event={event} style={style} />
    </div>
  );
}

function eventCardSubtitle(event: CalendarEventProjection): string | null {
  const candidates = [event.description, event.projectName].filter((value): value is string =>
    Boolean(value?.trim()),
  );
  for (const candidate of candidates) {
    if (candidate.trim().toLowerCase() === event.badge.trim().toLowerCase()) continue;
    if (candidate.trim().toLowerCase() === event.title.trim().toLowerCase()) continue;
    return candidate;
  }
  return null;
}

function EventCardInner({
  event,
  style,
}: {
  event: CalendarEventProjection;
  style: (typeof LAYER_STYLES)[CalendarEventProjection['layer']];
}) {
  const subtitle = eventCardSubtitle(event);
  const timeLabel = event.isAllDay
    ? 'All day'
    : new Date(event.startsAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className={`min-w-0 truncate text-sm font-medium ${style.text}`}>{event.title}</p>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${style.badge}`}
        >
          {event.badge.replaceAll('_', ' ')}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
        <span className="text-foreground flex items-center gap-1.5 text-sm font-semibold tabular-nums">
          <Clock size={14} className="text-foreground/70" aria-hidden />
          {timeLabel}
        </span>
        <span className="text-muted-foreground text-xs capitalize">
          {event.status.replaceAll('_', ' ').toLowerCase()}
        </span>
        {event.ownerName ? (
          <span className="text-muted-foreground truncate text-xs">{event.ownerName}</span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{subtitle}</p>
      ) : null}
    </>
  );
}

export function CalendarEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <CalendarDays size={28} className="text-muted-foreground/40" />
      <p className="text-muted-foreground mt-2 text-sm">No events for this day</p>
    </div>
  );
}
