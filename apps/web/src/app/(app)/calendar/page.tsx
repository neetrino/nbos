'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';

/* ───────── Types ───────── */

type EventType = 'meeting' | 'deadline' | 'billing' | 'personal';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: EventType;
  description: string;
}

/* ───────── Constants ───────── */

const EVENT_COLORS: Record<EventType, { dot: string; bg: string; text: string; label: string }> = {
  meeting: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Meeting' },
  deadline: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Deadline' },
  billing: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    label: 'Billing',
  },
  personal: {
    dot: 'bg-violet-500',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    label: 'Personal',
  },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/* ───────── Mock data ───────── */

function buildMockEvents(): CalendarEvent[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  return [
    {
      id: '1',
      title: 'Team standup',
      date: new Date(y, m, 3),
      time: '09:00',
      type: 'meeting',
      description: 'Daily sync with dev team',
    },
    {
      id: '2',
      title: 'Client call — ArmenTech',
      date: new Date(y, m, 5),
      time: '11:00',
      type: 'meeting',
      description: 'ERP project status update',
    },
    {
      id: '3',
      title: 'Invoice batch due',
      date: new Date(y, m, 7),
      time: '18:00',
      type: 'billing',
      description: 'Q1 invoice batch #47 payment deadline',
    },
    {
      id: '4',
      title: 'Sprint review',
      date: new Date(y, m, 10),
      time: '14:00',
      type: 'meeting',
      description: 'Sprint 14 demo and retrospective',
    },
    {
      id: '5',
      title: 'TechCorp delivery',
      date: new Date(y, m, 14),
      time: '23:59',
      type: 'deadline',
      description: 'Website v2 final delivery',
    },
    {
      id: '6',
      title: 'Gym session',
      date: new Date(y, m, 15),
      time: '07:30',
      type: 'personal',
      description: 'Weekly training at FitZone',
    },
    {
      id: '7',
      title: 'Q1 Report deadline',
      date: new Date(y, m, 20),
      time: '18:00',
      type: 'deadline',
      description: 'Financial report submission',
    },
    {
      id: '8',
      title: 'Partner dinner',
      date: new Date(y, m, 22),
      time: '19:00',
      type: 'personal',
      description: 'Dinner with SkyNet team',
    },
    {
      id: '9',
      title: 'Monthly billing',
      date: new Date(y, m, 25),
      time: '12:00',
      type: 'billing',
      description: 'Process recurring invoices',
    },
    {
      id: '10',
      title: 'Design review',
      date: new Date(y, m, 28),
      time: '10:00',
      type: 'meeting',
      description: 'Review new landing page designs',
    },
  ];
}

const MOCK_EVENTS = buildMockEvents();

/* ───────── Helpers ───────── */

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* ───────── Components ───────── */

function DayCell({
  date,
  events,
  isToday,
  isSelected,
  onSelect,
}: {
  date: Date | null;
  events: CalendarEvent[];
  isToday: boolean;
  isSelected: boolean;
  onSelect: (d: Date) => void;
}) {
  if (!date) {
    return <div className="min-h-[4.5rem] rounded-xl p-2" />;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className={`flex min-h-[4.5rem] flex-col items-start rounded-xl p-2 text-left transition-colors ${
        isSelected ? 'bg-primary/5 ring-primary ring-1' : 'hover:bg-secondary'
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
          isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
        }`}
      >
        {date.getDate()}
      </span>
      {events.length > 0 && (
        <div className="mt-1 flex gap-1">
          {events.slice(0, 3).map((e) => (
            <div key={e.id} className={`h-1.5 w-1.5 rounded-full ${EVENT_COLORS[e.type].dot}`} />
          ))}
          {events.length > 3 && (
            <span className="text-muted-foreground text-[10px] leading-none">
              +{events.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const style = EVENT_COLORS[event.type];

  return (
    <div className={`border-border rounded-xl border p-3 ${style.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${style.text}`}>{event.title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{event.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
      </div>
      <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
        <Clock size={12} />
        {event.time}
      </div>
    </div>
  );
}

/* ───────── Page ───────── */

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const grid = useMemo(
    () => getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth],
  );

  const eventsForDate = useCallback(
    (date: Date) => MOCK_EVENTS.filter((e) => isSameDay(e.date, date)),
    [],
  );

  const selectedEvents = useMemo(() => eventsForDate(selectedDate), [selectedDate, eventsForDate]);

  function goToPrevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your meetings, deadlines, and events.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToToday}
            className="text-foreground hover:bg-secondary rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goToPrevMonth}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl p-2 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-foreground min-w-[10rem] text-center text-sm font-semibold">
            {formatMonthYear(currentMonth)}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl p-2 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <div className="border-border bg-card rounded-2xl border p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-muted-foreground py-2 text-center text-xs font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date, i) => (
              <DayCell
                key={i}
                date={date}
                events={date ? eventsForDate(date) : []}
                isToday={date !== null && isSameDay(date, today)}
                isSelected={date !== null && isSameDay(date, selectedDate)}
                onSelect={setSelectedDate}
              />
            ))}
          </div>
        </div>

        {/* Side panel */}
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

          {selectedEvents.length > 0 ? (
            <div className="mt-4 space-y-3">
              {selectedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center">
              <CalendarDays size={32} className="text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground mt-2 text-sm">No events for this day</p>
            </div>
          )}

          {/* Legend */}
          <div className="border-border mt-6 border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">Event Types</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                Object.entries(EVENT_COLORS) as [EventType, (typeof EVENT_COLORS)[EventType]][]
              ).map(([type, style]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                  <span className="text-muted-foreground text-xs">{style.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
