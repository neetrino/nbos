'use client';

import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildReportsViewPath } from '../reports-routing';

/** Automatic report cron is off. Manual files live under Exports. */
export function ReportsSchedulePanel() {
  return (
    <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3">
        <CalendarClock className="text-muted-foreground mt-0.5 h-6 w-6 shrink-0" />
        <div>
          <p className="text-xl font-semibold">Automatic reports are off</p>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            Create a file when you need it: open a report tab, set the dates, then use settings to
            make CSV, XLSX or PDF. Download the file from Exports.
          </p>
          <Button asChild className="mt-4">
            <Link href={buildReportsViewPath('EXPORTS')}>Open report files</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
