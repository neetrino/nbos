import { Archive, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveLifecycleView } from './drive-lifecycle';

type LifecycleSegment = Exclude<DriveLifecycleView, 'browse'>;

const SEGMENTS: {
  key: LifecycleSegment;
  label: string;
  icon: typeof Archive;
}[] = [
  { key: 'archive', label: 'Archive', icon: Archive },
  { key: 'trash', label: 'Trash', icon: Trash2 },
];

export function DriveLifecycleNav({
  view,
  archiveCount,
  trashCount,
  onViewChange,
}: {
  view: DriveLifecycleView;
  archiveCount: number;
  trashCount: number;
  onViewChange: (view: DriveLifecycleView) => void;
}) {
  const counts: Record<LifecycleSegment, number> = {
    archive: archiveCount,
    trash: trashCount,
  };

  return (
    <div
      className="border-border/70 bg-card/80 rounded-3xl border p-1.5"
      role="group"
      aria-label="Archive and Trash"
    >
      <div className="bg-muted/50 grid grid-cols-2 gap-0.5 rounded-2xl p-0.5">
        {SEGMENTS.map((segment) => {
          const active = view === segment.key;
          const Icon = segment.icon;
          return (
            <button
              key={segment.key}
              type="button"
              aria-pressed={active}
              onClick={() => onViewChange(active ? 'browse' : segment.key)}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1.5 rounded-[0.85rem] px-2 py-2.5 transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/85 hover:bg-muted/80',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate text-xs font-semibold">{segment.label}</span>
              <span
                className={cn(
                  'shrink-0 text-[10px] font-medium tabular-nums',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}
              >
                {counts[segment.key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
