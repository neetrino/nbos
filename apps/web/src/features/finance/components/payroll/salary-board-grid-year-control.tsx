'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIN_SALARY_BOARD_YEAR = 2020;
const MAX_SALARY_BOARD_YEAR_OFFSET = 2;

export function SalaryBoardGridYearControl({
  year,
  onYearChange,
}: {
  year: number;
  onYearChange: (year: number) => void;
}) {
  const maxYear = new Date().getFullYear() + MAX_SALARY_BOARD_YEAR_OFFSET;

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8"
        aria-label="Previous year"
        disabled={year <= MIN_SALARY_BOARD_YEAR}
        onClick={() => onYearChange(year - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>
      <span className="text-foreground min-w-[3.5rem] text-center text-sm font-semibold tabular-nums">
        {year}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8"
        aria-label="Next year"
        disabled={year >= maxYear}
        onClick={() => onYearChange(year + 1)}
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
