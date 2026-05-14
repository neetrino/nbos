import {
  ArrowLeft,
  File,
  FileArchive,
  FileImage,
  FileText,
  Folder,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DriveFolder, FileAsset } from '@/lib/api/drive';
import { cn } from '@/lib/utils';
import { formatDriveDate, formatDriveLabel, formatFileSize } from './drive-format';
import type { DriveViewMode } from './drive-options';
import { badgeVariant } from './drive-utils';

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
  onBack,
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
  onBack?: () => void;
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
        onBack={onBack}
      />
    );
  }
  return (
    <div
      className={cn(
        viewMode === 'cards' ? 'grid gap-3 md:grid-cols-2 2xl:grid-cols-3' : 'space-y-2',
      )}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="border-border/70 bg-card/80 hover:bg-muted flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to parent
        </button>
      )}
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          compact={viewMode === 'list'}
          onOpenFolder={onOpenFolder}
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
  onBack,
}: {
  files: FileAsset[];
  folders: DriveFolder[];
  selectedId: string | null;
  checkedIds: string[];
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  onOpenFolder: (folder: DriveFolder) => void;
  onBack?: () => void;
}) {
  return (
    <div className="border-border/70 bg-card/80 overflow-hidden rounded-3xl border">
      <div className="text-muted-foreground grid grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px] gap-3 border-b px-4 py-3 text-xs font-medium">
        <span />
        <span>Name</span>
        <span>Purpose</span>
        <span>Access</span>
        <span>Updated</span>
        <span className="text-right">Size</span>
      </div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="hover:bg-muted/50 grid w-full grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px] gap-3 px-4 py-3 text-left text-sm"
        >
          <ArrowLeft className="size-4 self-center" />
          <span className="font-medium">Back to parent</span>
        </button>
      )}
      {folders.map((folder) => (
        <FolderTableRow key={folder.id} folder={folder} onOpenFolder={onOpenFolder} />
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

function FolderCard({
  folder,
  compact,
  onOpenFolder,
}: {
  folder: DriveFolder;
  compact: boolean;
  onOpenFolder: (folder: DriveFolder) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenFolder(folder)}
      className={cn(
        'border-border/70 bg-card/80 hover:border-primary/40 group w-full rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
        compact && 'rounded-2xl',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
          <Folder className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground truncate text-sm font-semibold">{folder.name}</h3>
          <p className="text-muted-foreground mt-1 text-xs">{folder.space} folder</p>
        </div>
      </div>
    </button>
  );
}

function FolderTableRow({
  folder,
  onOpenFolder,
}: {
  folder: DriveFolder;
  onOpenFolder: (folder: DriveFolder) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenFolder(folder)}
      className="hover:bg-muted/50 grid w-full grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px] gap-3 px-4 py-3 text-left text-sm"
    >
      <Folder className="size-4 self-center text-amber-600" />
      <span className="truncate font-medium">{folder.name}</span>
      <span className="text-muted-foreground text-xs">Folder</span>
      <span className="text-muted-foreground text-xs">{folder.space}</span>
      <span className="text-muted-foreground text-xs">{formatDriveDate(folder.updatedAt)}</span>
    </button>
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
  return (
    <button
      type="button"
      onClick={() => onSelect(file)}
      className={cn(
        'border-border/70 bg-card/80 group w-full rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
        selected && 'border-primary/60 ring-primary/20 ring-4',
        compact && 'rounded-2xl',
      )}
    >
      <div className="flex items-start gap-3">
        <FileCheckbox file={file} checked={checked} onToggleChecked={onToggleChecked} />
        <div className="bg-primary/10 text-primary rounded-2xl p-3">
          <FileTypeIcon fileType={file.fileType} className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-foreground line-clamp-2 text-sm font-semibold">
              {file.displayName}
            </h3>
            <MoreHorizontal className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {formatDriveLabel(file.purpose)} · {formatFileSize(file.sizeBytes)}
          </p>
          <FileBadges file={file} />
          {!compact && <FileCardFooter file={file} />}
        </div>
      </div>
    </button>
  );
}

function FileCheckbox({
  file,
  checked,
  onToggleChecked,
}: {
  file: FileAsset;
  checked: boolean;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onToggleChecked(file, event.target.checked)}
      onClick={(event) => event.stopPropagation()}
      className="mt-2 h-4 w-4"
      aria-label={`Select ${file.displayName}`}
    />
  );
}

function FileBadges({ file }: { file: FileAsset }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      <Badge variant={badgeVariant(file.status)}>{formatDriveLabel(file.status)}</Badge>
      <Badge variant={badgeVariant(file.confidentiality)}>
        {formatDriveLabel(file.confidentiality)}
      </Badge>
    </div>
  );
}

function FileCardFooter({ file }: { file: FileAsset }) {
  return (
    <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
      <span>{file.links.length} links</span>
      <span>{formatDriveDate(file.updatedAt)}</span>
    </div>
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
        'hover:bg-muted/50 grid w-full grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px] gap-3 px-4 py-3 text-left text-sm',
        selected && 'bg-primary/5',
      )}
    >
      <FileCheckbox file={file} checked={checked} onToggleChecked={onToggleChecked} />
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
