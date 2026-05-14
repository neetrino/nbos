'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarApi, type CalendarEventProjection, type CalendarLayer } from '@/lib/api/calendar';
import { Button } from '@/components/ui/button';
import { CreateMeetingCalendarDialog } from './calendar-create-meeting-dialog';
import { CreatePersonalCalendarDialog } from './calendar-create-personal-dialog';
import { CalendarEmptyState, DayCell, EventCard, WEEKDAYS } from './calendar-view-parts';

const LAYERS: Array<{ key: CalendarLayer; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'MEETINGS', label: 'Meetings' },
  { key: 'DELIVERY_DEADLINES', label: 'Delivery Deadlines' },
  { key: 'PERSONAL', label: 'Personal' },
];

function monthRange(date: Date): { from: Date; to: Date } {
  return {
    from: new Date(date.getFullYear(), date.getMonth(), 1),
    to: new Date(date.getFullYear(), date.getMonth() + 1, 1),
  };
}

function toIso(date: Date): string {
  return date.toISOString();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: startWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function eventStartsOnDay(event: CalendarEventProjection, date: Date): boolean {
  return isSameDay(new Date(event.startsAt), date);
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => monthRange(today).from);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [layer, setLayer] = useState<CalendarLayer>('ALL');
  const [events, setEvents] = useState<CalendarEventProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = monthRange(currentMonth);
      const items = await calendarApi.listEvents({
        from: toIso(range.from),
        to: toIso(range.to),
        layer,
      });
      setEvents(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, layer]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const grid = useMemo(
    () => getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth],
  );

  const eventsForDate = useCallback(
    (date: Date) => events.filter((event) => eventStartsOnDay(event, date)),
    [events],
  );
  const selectedEvents = useMemo(() => eventsForDate(selectedDate), [eventsForDate, selectedDate]);

  function goToPrevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrentMonth(monthRange(today).from);
    setSelectedDate(today);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Meetings, delivery deadlines and personal events only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LAYERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLayer(item.key)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                layer === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setMeetingOpen(true)}>
          New meeting
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setPersonalOpen(true)}>
          Personal event
        </Button>
        <button
          type="button"
          onClick={goToToday}
          className="hover:bg-secondary rounded-xl px-3 py-2 text-sm"
        >
          Today
        </button>
        <button type="button" onClick={goToPrevMonth} className="hover:bg-secondary rounded-xl p-2">
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[10rem] text-center text-sm font-semibold">
          {formatMonthYear(currentMonth)}
        </span>
        <button type="button" onClick={goToNextMonth} className="hover:bg-secondary rounded-xl p-2">
          <ChevronRight size={18} />
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-muted-foreground py-2 text-center text-xs font-medium">
                {day}
              </div>
            ))}
          </div>
          <div
            className="grid grid-cols-7 gap-1 opacity-100 data-[loading=true]:opacity-60"
            data-loading={loading}
          >
            {grid.map((date, index) => (
              <DayCell
                key={`${date?.toISOString() ?? 'empty'}-${index}`}
                date={date}
                events={date ? eventsForDate(date) : []}
                isToday={date !== null && isSameDay(date, today)}
                isSelected={date !== null && isSameDay(date, selectedDate)}
                onSelect={setSelectedDate}
              />
            ))}
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-accent" />
            <h2 className="text-foreground text-lg font-semibold">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </h2>
          </div>
          {loading ? (
            <p className="text-muted-foreground mt-8 text-center text-sm">
              Loading calendar events...
            </p>
          ) : selectedEvents.length > 0 ? (
            <div className="mt-4 space-y-3">
              {selectedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <CalendarEmptyState />
          )}
        </div>
      </div>

      <CreateMeetingCalendarDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        selectedDate={selectedDate}
        onCreated={() => void loadEvents()}
      />
      <CreatePersonalCalendarDialog
        open={personalOpen}
        onOpenChange={setPersonalOpen}
        selectedDate={selectedDate}
        onCreated={() => void loadEvents()}
      />
    </div>
  );
}
