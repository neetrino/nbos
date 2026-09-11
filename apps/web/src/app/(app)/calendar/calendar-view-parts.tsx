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
  { dot: string; bg: string; text: string; label: string }
> = {
  MEETINGS: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Meeting' },
  DELIVERY_DEADLINES: {
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    label: 'Delivery',
  },
  PERSONAL: {
    dot: 'bg-violet-500',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
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

  if (event.layer === 'DELIVERY_DEADLINES' && event.sourceHref) {
    return (
      <a
        href={event.sourceHref}
        className={`border-border block rounded-xl border p-3 ${style.bg}`}
      >
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
        className={`border-border block w-full cursor-pointer rounded-xl border p-3 text-left ${style.bg} hover:opacity-95`}
      >
        <EventCardInner event={event} style={style} />
      </button>
    );
  }

  return (
    <div className={`border-border rounded-xl border p-3 ${style.bg}`}>
      <EventCardInner event={event} style={style} />
    </div>
  );
}

function EventCardInner({
  event,
  style,
}: {
  event: CalendarEventProjection;
  style: (typeof LAYER_STYLES)[CalendarEventProjection['layer']];
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${style.text}`}>{event.title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {event.description ?? event.projectName ?? event.badge}
          </p>
        </div>
        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${style.text}`}>
          {event.badge}
        </span>
      </div>
      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {event.isAllDay
            ? 'All day'
            : new Date(event.startsAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
        </span>
        <span>{event.status.replaceAll('_', ' ')}</span>
        {event.ownerName && <span>{event.ownerName}</span>}
      </div>
    </>
  );
}

export function CalendarEmptyState() {
  return (
    <div className="mt-8 text-center">
      <CalendarDays size={32} className="text-muted-foreground/40 mx-auto" />
      <p className="text-muted-foreground mt-2 text-sm">No events for this day</p>
    </div>
  );
}
