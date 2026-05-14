import { cn } from '@/lib/utils';
import {
  DRIVE_LIBRARIES,
  FREE_DRIVE_LIBRARY_KEYS,
  MAINTENANCE_LIBRARY_KEYS,
  SYSTEM_LIBRARY_KEYS,
  type DriveLibraryKey,
  type DriveLibraryOption,
} from './drive-options';

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
        <h2 className="text-foreground text-sm font-semibold">Drive spaces</h2>
        <p className="text-muted-foreground mt-1 text-xs">System, company and personal views.</p>
      </div>
      <LibraryGroup
        title="System libraries"
        keys={SYSTEM_LIBRARY_KEYS}
        selected={selected}
        counts={counts}
        onSelect={onSelect}
      />
      <LibraryGroup
        title="Free drive"
        keys={FREE_DRIVE_LIBRARY_KEYS}
        selected={selected}
        counts={counts}
        onSelect={onSelect}
      />
      <LibraryGroup
        title="Maintenance"
        keys={MAINTENANCE_LIBRARY_KEYS}
        selected={selected}
        counts={counts}
        onSelect={onSelect}
      />
    </aside>
  );
}

function LibraryGroup({
  title,
  keys,
  selected,
  counts,
  onSelect,
}: {
  title: string;
  keys: DriveLibraryKey[];
  selected: DriveLibraryOption;
  counts: Map<string, number>;
  onSelect: (library: DriveLibraryOption) => void;
}) {
  const libraries = keys
    .map((key) => DRIVE_LIBRARIES.find((library) => library.key === key))
    .filter((library): library is DriveLibraryOption => Boolean(library));

  return (
    <div className="mt-3">
      <div className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
        {title}
      </div>
      <div className="space-y-1">
        {libraries.map((library) => (
          <LibraryButton
            key={library.key}
            library={library}
            count={counts.get(library.key) ?? 0}
            active={library.key === selected.key}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
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
