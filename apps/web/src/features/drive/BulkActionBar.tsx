import { Archive, ListChecks, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BulkActionBar({
  count,
  selectedFileCount,
  selectedFolderCount,
  archived,
  busy,
  onArchive,
  onRestore,
  onClear,
  showSelectAll,
  onSelectAll,
  showLibraryBulkActions,
  onPlaceInCompanyFolder,
  onZipExport,
}: {
  count: number;
  /** When set with `selectedFolderCount`, label reflects files + folders. */
  selectedFileCount?: number;
  selectedFolderCount?: number;
  archived: boolean;
  busy: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onClear: () => void;
  showSelectAll?: boolean;
  onSelectAll?: () => void;
  showLibraryBulkActions?: boolean;
  onPlaceInCompanyFolder?: () => void;
  onZipExport?: () => void;
}) {
  const fileCount = selectedFileCount ?? count;
  const folderCount = selectedFolderCount ?? 0;
  const selectionLabel =
    folderCount > 0
      ? `${fileCount} file${fileCount === 1 ? '' : 's'}, ${folderCount} folder${folderCount === 1 ? '' : 's'}`
      : `${count} selected`;

  return (
    <div className="border-border/70 bg-card flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium">{selectionLabel}</p>
      <div className="flex flex-wrap gap-2">
        {showSelectAll && onSelectAll ? (
          <Button type="button" variant="outline" disabled={busy} onClick={() => onSelectAll()}>
            <ListChecks />
            Select all
          </Button>
        ) : null}
        {showLibraryBulkActions ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onPlaceInCompanyFolder?.()}
            >
              Place in Company folder…
            </Button>
          </>
        ) : null}
        {onZipExport ? (
          <Button type="button" variant="outline" disabled={busy} onClick={() => onZipExport()}>
            <Package />
            Download as ZIP
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={archived ? onRestore : onArchive}
        >
          <Archive />
          {archived ? 'Restore selected' : 'Archive selected'}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
