'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS =
  'flex w-full min-w-0 flex-col items-stretch gap-1.5';

export interface FinanceCalendarYearControlProps {
  year: number;
  onYearChange: (year: number) => void;
  minYear: number;
  maxYearOffset?: number;
  className?: string;
}

/** Compact year stepper sized to fit finance calendar label columns. */
export function FinanceCalendarYearControl({
  year,
  onYearChange,
  minYear,
  maxYearOffset = 2,
  className,
}: FinanceCalendarYearControlProps) {
  const maxYear = new Date().getFullYear() + maxYearOffset;

  return (
    <div
      className={cn(
        'border-border bg-muted/30 flex w-full min-w-0 max-w-full items-center gap-0.5 rounded-full border p-0.5',
        className,
      )}
      role="group"
      aria-label="Calendar year"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 rounded-full"
        aria-label="Previous year"
        disabled={year <= minYear}
        onClick={() => onYearChange(year - 1)}
      >
        <ChevronLeft className="size-3.5" aria-hidden />
      </Button>
      <span className="text-foreground min-w-0 flex-1 truncate text-center text-xs font-semibold tabular-nums">
        {year}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 rounded-full"
        aria-label="Next year"
        disabled={year >= maxYear}
        onClick={() => onYearChange(year + 1)}
      >
        <ChevronRight className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
