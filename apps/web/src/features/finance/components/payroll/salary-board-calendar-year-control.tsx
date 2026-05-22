'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MIN_SALARY_BOARD_YEAR = 2020;
const MAX_SALARY_BOARD_YEAR_OFFSET = 2;

export function SalaryBoardCalendarYearControl({
  year,
  onYearChange,
}: {
  year: number;
  onYearChange: (year: number) => void;
}) {
  const maxYear = new Date().getFullYear() + MAX_SALARY_BOARD_YEAR_OFFSET;

  return (
    <div
      className="border-border bg-muted/30 inline-flex items-center gap-0.5 rounded-full border p-0.5"
      role="group"
      aria-label="Calendar year"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="Previous year"
        disabled={year <= MIN_SALARY_BOARD_YEAR}
        onClick={() => onYearChange(year - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>
      <span
        className={cn(
          'text-foreground min-w-[3.25rem] px-1 text-center text-sm font-semibold tabular-nums',
        )}
      >
        {year}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="Next year"
        disabled={year >= maxYear}
        onClick={() => onYearChange(year + 1)}
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
