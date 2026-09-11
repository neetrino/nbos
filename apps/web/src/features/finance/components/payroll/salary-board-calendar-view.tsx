'use client';

import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { SalaryBoardResponse } from '@/lib/api/payroll-runs';
import { SalaryBoardCalendarDesktopGrid } from './salary-board-calendar-desktop-grid';
import { SalaryBoardCalendarMobileBoard } from './salary-board-calendar-mobile-board';

export function SalaryBoardCalendarView({
  data,
  rows,
  calendarYear,
  onCalendarYearChange,
  onOpenMonth,
}: {
  data: SalaryBoardResponse;
  rows: SalaryBoardResponse['rows'];
  calendarYear: number;
  onCalendarYearChange: (year: number) => void;
  onOpenMonth: (salaryLineId: string) => void;
}) {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport) {
    return (
      <SalaryBoardCalendarMobileBoard
        data={data}
        rows={rows}
        calendarYear={calendarYear}
        onCalendarYearChange={onCalendarYearChange}
        onOpenMonth={onOpenMonth}
      />
    );
  }

  return (
    <SalaryBoardCalendarDesktopGrid
      data={data}
      rows={rows}
      calendarYear={calendarYear}
      onCalendarYearChange={onCalendarYearChange}
      onOpenMonth={onOpenMonth}
    />
  );
}
