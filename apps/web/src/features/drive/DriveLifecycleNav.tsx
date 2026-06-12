import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveLifecycleView } from './drive-lifecycle';

export function DriveLifecycleNav({
  view,
  trashCount,
  onViewChange,
}: {
  view: DriveLifecycleView;
  trashCount: number;
  onViewChange: (view: DriveLifecycleView) => void;
}) {
  const active = view === 'trash';

  return (
    <div
      className="border-border/70 bg-card/80 rounded-3xl border p-1.5"
      role="group"
      aria-label="Trash"
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onViewChange(active ? 'browse' : 'trash')}
        className={cn(
          'flex w-full min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 transition-colors',
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-foreground/85 hover:bg-muted/80',
        )}
      >
        <Trash2 className="size-4 shrink-0" aria-hidden />
        <span className="truncate text-xs font-semibold">Trash</span>
        <span
          className={cn(
            'shrink-0 text-[10px] font-medium tabular-nums',
            active ? 'text-primary-foreground/80' : 'text-muted-foreground',
          )}
        >
          {trashCount}
        </span>
      </button>
    </div>
  );
}
