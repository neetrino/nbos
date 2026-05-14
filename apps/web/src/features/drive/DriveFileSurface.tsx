import { File, FileArchive, FileImage, FileText, Loader2 } from 'lucide-react';
import type { DriveFolder, FileAsset } from '@/lib/api/drive';
import { cn } from '@/lib/utils';
import { formatDriveDate, formatDriveLabel, formatFileSize } from './drive-format';
import type { DriveViewMode } from './drive-options';
import { DriveFileCardThumbnail } from './DriveFileCardThumbnail';
import { DriveFolderCardRow, DriveFolderTableRow } from './DriveFolderRows';

const FILE_TABLE_GRID_CLASS =
  'grid grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px_44px] gap-3';

export function DriveFileSurface({
  files,
  folders,
  loading,
  viewMode,
  selectedId,
  checkedIds,
  onSelect,
  onToggleChecked,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  files: FileAsset[];
  folders: DriveFolder[];
  loading: boolean;
  viewMode: DriveViewMode;
  selectedId: string | null;
  checkedIds: string[];
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  onOpenFolder: (folder: DriveFolder) => void;
  onRenameFolder?: (folder: DriveFolder) => void;
  onDeleteFolder?: (folder: DriveFolder) => void;
}) {
  if (loading) {
    return (
      <div className="border-border/70 bg-card/60 flex justify-center rounded-3xl border py-16">
        <Loader2 className="text-muted-foreground animate-spin" size={28} />
      </div>
    );
  }
  if (files.length === 0 && folders.length === 0) return <DriveEmptyState />;
  if (viewMode === 'table') {
    return (
      <FileTable
        files={files}
        folders={folders}
        selectedId={selectedId}
        checkedIds={checkedIds}
        onSelect={onSelect}
        onToggleChecked={onToggleChecked}
        onOpenFolder={onOpenFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
      />
    );
  }
  return (
    <div
      className={cn(
        viewMode === 'cards'
          ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7'
          : 'space-y-2',
      )}
    >
      {folders.map((folder) => (
        <DriveFolderCardRow
          key={folder.id}
          folder={folder}
          compact={viewMode === 'list'}
          onOpenFolder={onOpenFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          compact={viewMode === 'list'}
          selected={file.id === selectedId}
          checked={checkedIds.includes(file.id)}
          onSelect={onSelect}
          onToggleChecked={onToggleChecked}
        />
      ))}
    </div>
  );
}

function FileTable({
  files,
  folders,
  selectedId,
  checkedIds,
  onSelect,
  onToggleChecked,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  files: FileAsset[];
  folders: DriveFolder[];
  selectedId: string | null;
  checkedIds: string[];
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  onOpenFolder: (folder: DriveFolder) => void;
  onRenameFolder?: (folder: DriveFolder) => void;
  onDeleteFolder?: (folder: DriveFolder) => void;
}) {
  return (
    <div className="border-border/70 bg-card/80 overflow-hidden rounded-3xl border">
      <div
        className={cn(
          'text-muted-foreground border-b px-4 py-3 text-xs font-medium',
          FILE_TABLE_GRID_CLASS,
        )}
      >
        <span />
        <span>Name</span>
        <span>Purpose</span>
        <span>Access</span>
        <span>Updated</span>
        <span className="text-right">Size</span>
        <span />
      </div>
      {folders.map((folder) => (
        <DriveFolderTableRow
          key={folder.id}
          folder={folder}
          onOpenFolder={onOpenFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
      {files.map((file) => (
        <FileTableRow
          key={file.id}
          file={file}
          selected={file.id === selectedId}
          checked={checkedIds.includes(file.id)}
          onSelect={onSelect}
          onToggleChecked={onToggleChecked}
        />
      ))}
    </div>
  );
}

function DriveEmptyState() {
  return (
    <div className="border-border/70 bg-card/60 rounded-3xl border border-dashed px-6 py-16 text-center">
      <File className="text-muted-foreground/40 mx-auto" size={40} />
      <h2 className="text-foreground mt-4 font-semibold">No files in this view</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
        Upload from a linked module or adjust filters. Drive keeps honest empty states instead of
        inventing files or mixing unrelated libraries.
      </p>
    </div>
  );
}

function FileCard({
  file,
  compact,
  selected,
  checked,
  onSelect,
  onToggleChecked,
}: {
  file: FileAsset;
  compact: boolean;
  selected: boolean;
  checked: boolean;
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onSelect(file)}
        className={cn(
          'border-border/70 bg-card/80 hover:bg-muted/40 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all',
          selected && 'border-primary/60 ring-primary/15 ring-2',
        )}
      >
        <FileCheckbox
          file={file}
          checked={checked}
          onToggleChecked={onToggleChecked}
          className="mt-0 shrink-0 self-center"
        />
        <div className="border-border/60 relative size-12 shrink-0 overflow-hidden rounded-lg border">
          <DriveFileCardThumbnail file={file} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground truncate text-sm font-semibold">{file.displayName}</h3>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {formatFileSize(file.sizeBytes)}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(file)}
      className={cn(
        'border-border/70 bg-card/80 group flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
        selected && 'border-primary/60 ring-primary/20 ring-2',
      )}
    >
      <div className="border-border/60 relative aspect-[4/3] w-full shrink-0 border-b">
        <div className="absolute top-2 left-2 z-10">
          <FileCheckbox
            file={file}
            checked={checked}
            onToggleChecked={onToggleChecked}
            className="mt-0"
          />
        </div>
        <DriveFileCardThumbnail file={file} />
      </div>
      <div className="min-w-0 p-3">
        <h3 className="text-foreground line-clamp-2 text-sm font-semibold">{file.displayName}</h3>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {formatFileSize(file.sizeBytes)}
        </p>
      </div>
    </button>
  );
}

function FileCheckbox({
  file,
  checked,
  onToggleChecked,
  className,
}: {
  file: FileAsset;
  checked: boolean;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onToggleChecked(file, event.target.checked)}
      onClick={(event) => event.stopPropagation()}
      className={cn('h-4 w-4 rounded border', className)}
      aria-label={`Select ${file.displayName}`}
    />
  );
}

function FileTableRow({
  file,
  selected,
  checked,
  onSelect,
  onToggleChecked,
}: {
  file: FileAsset;
  selected: boolean;
  checked: boolean;
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(file)}
      className={cn(
        'hover:bg-muted/50 w-full px-4 py-3 text-left text-sm',
        FILE_TABLE_GRID_CLASS,
        selected && 'bg-primary/5',
      )}
    >
      <FileCheckbox
        file={file}
        checked={checked}
        onToggleChecked={onToggleChecked}
        className="mt-2 self-start"
      />
      <span className="flex min-w-0 items-center gap-2">
        <FileTypeIcon fileType={file.fileType} className="text-muted-foreground size-4 shrink-0" />
        <span className="truncate font-medium">{file.displayName}</span>
      </span>
      <span className="text-muted-foreground truncate text-xs">
        {formatDriveLabel(file.purpose)}
      </span>
      <span className="text-muted-foreground truncate text-xs">
        {formatDriveLabel(file.visibility)}
      </span>
      <span className="text-muted-foreground text-xs">{formatDriveDate(file.updatedAt)}</span>
      <span className="text-muted-foreground text-right text-xs">
        {formatFileSize(file.sizeBytes)}
      </span>
      <span />
    </button>
  );
}

function FileTypeIcon({ fileType, className }: { fileType: string; className?: string }) {
  if (fileType === 'IMAGE') return <FileImage className={className} />;
  if (fileType === 'ARCHIVE') return <FileArchive className={className} />;
  if (fileType === 'DOCUMENT' || fileType === 'SPREADSHEET') {
    return <FileText className={className} />;
  }
  return <File className={className} />;
}
