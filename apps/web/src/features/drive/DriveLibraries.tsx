import { cn } from '@/lib/utils';
import { DRIVE_LIBRARIES, type DriveLibraryOption, type DriveSpaceOption } from './drive-options';

export function DriveLibraries({
  space,
  selected,
  counts,
  onSelect,
}: {
  space: DriveSpaceOption;
  selected: DriveLibraryOption;
  counts: Map<string, number>;
  onSelect: (library: DriveLibraryOption) => void;
}) {
  const folders = space.libraryKeys
    .map((key) => DRIVE_LIBRARIES.find((library) => library.key === key))
    .filter((library): library is DriveLibraryOption => Boolean(library));

  return (
    <aside className="border-border/70 bg-card/80 h-fit rounded-3xl border p-2">
      <div className="space-y-1">
        {folders.map((library) => (
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
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{library.title}</span>
      <span
        className={cn('text-xs', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}
      >
        {count}
      </span>
    </button>
  );
}
