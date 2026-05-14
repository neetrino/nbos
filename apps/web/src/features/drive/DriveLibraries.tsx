import { DRIVE_LIBRARIES, type DriveLibraryOption } from './drive-options';
import { cn } from '@/lib/utils';

export function DriveLibraries({
  selected,
  counts,
  onSelect,
}: {
  selected: DriveLibraryOption;
  counts: Map<string, number>;
  onSelect: (library: DriveLibraryOption) => void;
}) {
  return (
    <aside className="border-border/70 bg-card/80 h-fit rounded-3xl border p-3">
      <div className="px-2 py-2">
        <h2 className="text-foreground text-sm font-semibold">Libraries</h2>
        <p className="text-muted-foreground mt-1 text-xs">Views by business context.</p>
      </div>
      <div className="mt-2 space-y-1">
        {DRIVE_LIBRARIES.map((library) => (
          <LibraryButton
            key={library.key}
            library={library}
            count={counts.get(library.key) ?? 0}
            active={library.key === selected.key}
            onSelect={onSelect}
          />
        ))}
      </div>
    </aside>
  );
}

function LibraryButton({
  library,
  count,
  active,
  onSelect,
}: {
  library: DriveLibraryOption;
  count: number;
  active: boolean;
  onSelect: (library: DriveLibraryOption) => void;
}) {
  const Icon = library.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(library)}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{library.title}</span>
        <span
          className={cn(
            'block truncate text-xs',
            active ? 'text-primary-foreground/75' : 'text-muted-foreground',
          )}
        >
          {library.description}
        </span>
      </span>
      <span
        className={cn('text-xs', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}
      >
        {count}
      </span>
    </button>
  );
}
