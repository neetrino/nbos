import { Clock } from 'lucide-react';

interface DetailSheetMetaDateProps {
  label: string;
  value: string;
}

/** Read-only meta row: clock icon, label, and date value in a pill (detail sheets). */
export function DetailSheetMetaDate({ label, value }: DetailSheetMetaDateProps) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="text-muted-foreground/70 flex size-6 shrink-0 items-center justify-center">
        <Clock size={14} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <span className="border-border bg-muted/20 text-foreground rounded-lg border px-2.5 py-1 text-sm tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}
