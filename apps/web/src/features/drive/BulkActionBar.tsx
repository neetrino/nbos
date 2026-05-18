import { Archive, Link2Off, ListChecks, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BulkActionBar({
  count,
  selectedFileCount,
  selectedFolderCount,
  archived,
  trashView,
  busy,
  onArchive,
  onRestore,
  onMoveToTrash,
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
  archived: boolean;
  trashView?: boolean;
  busy: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onMoveToTrash?: () => void;
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
    <BulkActionBarActions
      selectionLabel={selectionLabel}
      archived={archived}
      trashView={trashView}
      busy={busy}
      showSelectAll={showSelectAll}
      onSelectAll={onSelectAll}
      showLibraryBulkActions={showLibraryBulkActions}
      onPlaceInCompanyFolder={onPlaceInCompanyFolder}
      onUnlinkFromRecord={onUnlinkFromRecord}
      onZipExport={onZipExport}
      onArchive={onArchive}
      onRestore={onRestore}
      onMoveToTrash={onMoveToTrash}
      onClear={onClear}
    />
  );
}

function BulkActionBarActions({
  selectionLabel,
  archived,
  trashView,
  busy,
  showSelectAll,
  onSelectAll,
  showLibraryBulkActions,
  onPlaceInCompanyFolder,
  onUnlinkFromRecord,
  onZipExport,
  onArchive,
  onRestore,
  onMoveToTrash,
  onClear,
}: {
  selectionLabel: string;
  archived: boolean;
  trashView?: boolean;
  busy: boolean;
  showSelectAll?: boolean;
  onSelectAll?: () => void;
  showLibraryBulkActions?: boolean;
  onPlaceInCompanyFolder?: () => void;
  onUnlinkFromRecord?: () => void;
  onZipExport?: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onMoveToTrash?: () => void;
  onClear: () => void;
}) {
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
                Unlink from record
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
            <Archive />
            Restore selected
          </Button>
        ) : archived ? (
          <>
            <Button type="button" variant="outline" disabled={busy} onClick={onRestore}>
              <Archive />
              Restore selected
            </Button>
            {onMoveToTrash ? (
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
          </>
        ) : (
          <Button type="button" variant="outline" disabled={busy} onClick={onArchive}>
            <Archive />
            Archive selected
          </Button>
        )}
        <Button type="button" variant="ghost" disabled={busy} onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
