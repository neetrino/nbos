'use client';

import { useCallback, useState, type DragEvent } from 'react';
import { File, FileArchive, FileImage, FileText, Loader2 } from 'lucide-react';
import type { DriveFolder, FileAsset } from '@/lib/api/drive';
import { cn } from '@/lib/utils';
import { formatDriveDate, formatDriveLabel, formatFileSize } from './drive-format';
import type { DriveViewMode } from './drive-options';
import {
  DriveFileCard,
  DriveFileCheckbox,
  type DriveFileCardDragConfig,
  type DriveFileCardMenuHandlers,
} from './DriveFileCard';
import {
  DriveFolderCardRow,
  DriveFolderTableRow,
  type DriveFolderFileDropHandlers,
} from './DriveFolderRows';
import {
  DRIVE_FILE_DRAG_MIME,
  dataTransferHasDriveFileDrag,
  parseDriveFileDragPayload,
  stringifyDriveFileDragPayload,
} from './drive-file-drag';

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
  fileMenu,
  fileDrag,
  folderFileDrop,
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
  fileMenu?: DriveFileCardMenuHandlers;
  fileDrag?: DriveFileCardDragConfig;
  folderFileDrop?: {
    sourceFolderId: string;
    onMoveFilesToFolder: (fileIds: string[], targetFolderId: string) => void | Promise<void>;
    busy?: boolean;
  };
}) {
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  const buildFolderDropHandlers = useCallback(
    (folderId: string): DriveFolderFileDropHandlers | undefined => {
      if (!folderFileDrop) return undefined;
      const { sourceFolderId, onMoveFilesToFolder, busy } = folderFileDrop;
      if (folderId === sourceFolderId) return undefined;

      return {
        onDragOver: (event: DragEvent) => {
          if (busy || !dataTransferHasDriveFileDrag(event.dataTransfer)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setDropTargetFolderId(folderId);
        },
        onDragLeave: (event: DragEvent) => {
          const next = event.relatedTarget as Node | null;
          if (next && event.currentTarget.contains(next)) return;
          setDropTargetFolderId((current) => (current === folderId ? null : current));
        },
        onDrop: (event: DragEvent) => {
          event.preventDefault();
          setDropTargetFolderId(null);
          if (busy) return;
          const raw = event.dataTransfer.getData(DRIVE_FILE_DRAG_MIME);
          const parsed = parseDriveFileDragPayload(raw);
          if (!parsed?.fileIds.length) return;
          void onMoveFilesToFolder([...parsed.fileIds], folderId);
        },
      };
    },
    [folderFileDrop],
  );

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
        fileDrag={fileDrag}
        dropTargetFolderId={dropTargetFolderId}
        buildFolderDropHandlers={buildFolderDropHandlers}
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
          fileDropHighlight={dropTargetFolderId === folder.id}
          fileDropHandlers={buildFolderDropHandlers(folder.id)}
        />
      ))}
      {files.map((file) => (
        <DriveFileCard
          key={file.id}
          file={file}
          compact={viewMode === 'list'}
          selected={file.id === selectedId}
          checked={checkedIds.includes(file.id)}
          onSelect={onSelect}
          onToggleChecked={onToggleChecked}
          menu={fileMenu}
          fileDrag={fileDrag}
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
  fileDrag,
  dropTargetFolderId,
  buildFolderDropHandlers,
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
  fileDrag?: DriveFileCardDragConfig;
  dropTargetFolderId: string | null;
  buildFolderDropHandlers: (folderId: string) => DriveFolderFileDropHandlers | undefined;
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
          fileDropHighlight={dropTargetFolderId === folder.id}
          fileDropHandlers={buildFolderDropHandlers(folder.id)}
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
          fileDrag={fileDrag}
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
        Try another library or space, clear search, or upload from a linked record. Empty views are
        intentional — NBOS does not mix unrelated libraries.
      </p>
      <p className="text-muted-foreground mx-auto mt-3 max-w-md text-xs">
        Tip: open <strong className="text-foreground">Analytics</strong> in the header for counts;
        use bulk actions when files are selected.
      </p>
    </div>
  );
}

function FileTableRow({
  file,
  selected,
  checked,
  onSelect,
  onToggleChecked,
  fileDrag,
}: {
  file: FileAsset;
  selected: boolean;
  checked: boolean;
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  fileDrag?: DriveFileCardDragConfig;
}) {
  const draggable = Boolean(fileDrag);
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={
        fileDrag
          ? (event) => {
              const ids = fileDrag.resolveDragFileIds(file);
              event.dataTransfer.setData(
                DRIVE_FILE_DRAG_MIME,
                stringifyDriveFileDragPayload({ fileIds: ids }),
              );
              event.dataTransfer.effectAllowed = 'move';
            }
          : undefined
      }
      onClick={() => onSelect(file)}
      className={cn(
        'hover:bg-muted/50 w-full px-4 py-3 text-left text-sm',
        FILE_TABLE_GRID_CLASS,
        selected && 'bg-primary/5',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <DriveFileCheckbox
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
