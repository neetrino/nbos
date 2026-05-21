'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { setMonth, setYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buildMonthPickerMonthLabels } from './date-picker-presets';

export interface NbosMonthPickerGridProps {
  viewYear: number;
  selectedMonth?: Date;
  locale: string;
  onViewYearChange: (year: number) => void;
  onSelectMonth: (monthIndex: number) => void;
  className?: string;
}

export function NbosMonthPickerGrid({
  viewYear,
  selectedMonth,
  locale,
  onViewYearChange,
  onSelectMonth,
  className,
}: NbosMonthPickerGridProps) {
  const labels = buildMonthPickerMonthLabels(locale);
  const selectedIndex = selectedMonth?.getMonth();
  const selectedYear = selectedMonth?.getFullYear();

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8 rounded-lg"
          aria-label="Previous year"
          onClick={() => onViewYearChange(viewYear - 1)}
        >
          <ChevronLeft size={18} />
        </Button>
        <span className="text-foreground text-sm font-semibold">{viewYear}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8 rounded-lg"
          aria-label="Next year"
          onClick={() => onViewYearChange(viewYear + 1)}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
      <div className="grid max-h-52 grid-cols-3 gap-1 overflow-y-auto">
        {labels.map((label, monthIndex) => {
          const isSelected = selectedYear === viewYear && selectedIndex === monthIndex;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectMonth(monthIndex)}
              className={cn(
                'rounded-lg px-2 py-2.5 text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted/60',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function monthDateFromParts(year: number, monthIndex: number): Date {
  return setMonth(setYear(new Date(), year), monthIndex);
}
