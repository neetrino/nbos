import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DRIVE_LIBRARIES, type DriveLibraryOption, type DriveSpaceOption } from './drive-options';

const STORAGE_LIBRARY_KEYS = new Set<DriveLibraryOption['key']>(['company', 'personal']);

export function DriveLibraries({
  space,
  selected,
  counts,
  onSelect,
  atStorageLibraryRoot,
  sidebarCreateMenu,
  contextSlot,
  folderTreeSlot,
}: {
  space: DriveSpaceOption;
  selected: DriveLibraryOption;
  counts: Map<string, number>;
  onSelect: (library: DriveLibraryOption) => void;
  /** When false, Company/Personal row is not highlighted (user is inside a subfolder). */
  atStorageLibraryRoot: boolean;
  sidebarCreateMenu?: ReactNode;
  contextSlot?: ReactNode;
  folderTreeSlot?: { forLibraryKey: DriveLibraryOption['key']; children: ReactNode };
}) {
  const folders = space.libraryKeys
    .map((key) => DRIVE_LIBRARIES.find((library) => library.key === key))
    .filter((library): library is DriveLibraryOption => Boolean(library));

  return (
    <aside className="border-border/70 bg-card/80 h-fit rounded-3xl border p-2">
      {sidebarCreateMenu}
      {contextSlot}
      <div className="space-y-1">
        {folders.map((library) => (
          <div key={library.key} className="space-y-0">
            <LibraryButton
              library={library}
              count={counts.get(library.key) ?? 0}
              active={
                library.key === selected.key &&
                (!STORAGE_LIBRARY_KEYS.has(library.key) || atStorageLibraryRoot)
              }
              onSelect={onSelect}
            />
            {folderTreeSlot?.forLibraryKey === library.key ? (
              <div className="mt-0.5 pt-0.5 pb-0.5 pl-1">{folderTreeSlot.children}</div>
            ) : null}
          </div>
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
        active
          ? 'bg-primary/12 text-foreground ring-primary/20 ring-1'
          : 'text-foreground hover:bg-muted',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{library.title}</span>
      <span className="text-muted-foreground text-xs">{count}</span>
    </button>
  );
}
