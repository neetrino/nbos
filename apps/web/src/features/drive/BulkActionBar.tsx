import { Link2Off, ListChecks, Package, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BulkActionBar({
  count,
  selectedFileCount,
  selectedFolderCount,
  trashView,
  busy,
  onMoveToTrash,
  onRestore,
  onClear,
  showSelectAll,
  onSelectAll,
  showLibraryBulkActions,
  onPlaceInCompanyFolder,
  onUnlinkFromRecord,
  onZipExport,
}: {
  count: number;
  selectedFileCount?: number;
  selectedFolderCount?: number;
  trashView?: boolean;
  busy: boolean;
  onMoveToTrash?: () => void;
  onRestore: () => void;
  onClear: () => void;
  showSelectAll?: boolean;
  onSelectAll?: () => void;
  showLibraryBulkActions?: boolean;
  onPlaceInCompanyFolder?: () => void;
  onUnlinkFromRecord?: () => void;
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
        {!trashView && showLibraryBulkActions ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onPlaceInCompanyFolder?.()}
            >
              Place in Company folder…
            </Button>
            {onUnlinkFromRecord ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => onUnlinkFromRecord()}
              >
                <Link2Off />
                Unlink
              </Button>
            ) : null}
          </>
        ) : null}
        {!trashView && onZipExport ? (
          <Button type="button" variant="outline" disabled={busy} onClick={() => onZipExport()}>
            <Package />
            Download as ZIP
          </Button>
        ) : null}
        {trashView ? (
          <Button type="button" variant="outline" disabled={busy} onClick={onRestore}>
            <RotateCcw />
            Restore selected
          </Button>
        ) : onMoveToTrash ? (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => onMoveToTrash()}
          >
            <Trash2 />
            Move to Trash
          </Button>
        ) : null}
        <Button type="button" variant="ghost" disabled={busy} onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
