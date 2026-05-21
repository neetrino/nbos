'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NBOS_DATE_PICKER_DAY_CELL_CLASS } from './date-picker-constants';
import { formatMonthYearHeader } from './date-picker-presets';
import {
  buildMonthGrid,
  getWeekdayLabels,
  isSameDay,
  isToday,
  isWeekend,
  navigateViewMonth,
} from './date-picker-grid';

export interface NbosCalendarGridProps {
  viewMonth: Date;
  selectedDate?: Date;
  locale: string;
  onViewMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  onHeaderClick?: () => void;
  className?: string;
}

export function NbosCalendarGrid({
  viewMonth,
  selectedDate,
  locale,
  onViewMonthChange,
  onSelectDate,
  onHeaderClick,
  className,
}: NbosCalendarGridProps) {
  const weekdays = getWeekdayLabels(locale);
  const cells = buildMonthGrid(viewMonth);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-8 shrink-0 rounded-lg"
          aria-label="Previous month"
          onClick={() => onViewMonthChange(navigateViewMonth(viewMonth, -1))}
        >
          <ChevronLeft size={18} />
        </Button>
        <button
          type="button"
          onClick={onHeaderClick}
          className={cn(
            'text-foreground min-w-0 flex-1 truncate text-center text-sm font-semibold tracking-tight',
            onHeaderClick && 'hover:text-primary transition-colors',
          )}
        >
          {formatMonthYearHeader(viewMonth, locale)}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-8 shrink-0 rounded-lg"
          aria-label="Next month"
          onClick={() => onViewMonthChange(navigateViewMonth(viewMonth, 1))}
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {weekdays.map((label) => (
          <div
            key={label}
            className="text-muted-foreground flex h-8 items-center justify-center text-[11px] font-medium tracking-wide uppercase"
          >
            {label.replace(/\.$/, '')}
          </div>
        ))}
        {cells.map((cell) => {
          const selected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
          const today = isToday(cell.date);
          const weekend = isWeekend(cell.date);
          return (
            <button
              key={cell.date.toISOString()}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={cn(
                NBOS_DATE_PICKER_DAY_CELL_CLASS,
                'mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-colors',
                !cell.inCurrentMonth && 'text-muted-foreground/35',
                cell.inCurrentMonth && !selected && !today && weekend && 'text-calendar-weekend',
                cell.inCurrentMonth &&
                  !selected &&
                  !today &&
                  !weekend &&
                  'text-foreground hover:bg-muted/60',
                today && !selected && 'text-primary font-semibold',
                selected && 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
