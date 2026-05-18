'use client';

import { Archive, Copy, FolderInput, MoreHorizontal, PanelRightOpen } from 'lucide-react';
import type { FileAsset } from '@/lib/api/drive';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDriveLabel, formatFileSize } from './drive-format';
import { DriveTileShell } from './DriveTileShell';
import { DriveFileCardThumbnail } from './DriveFileCardThumbnail';
import { DRIVE_FILE_DRAG_MIME, stringifyDriveFileDragPayload } from './drive-file-drag';

/** When set, file cards can be dragged onto folder drop targets (same source folder). */
export type DriveFileCardDragConfig = {
  sourceFolderId: string;
  /** If the dragged file is among checked rows, all checked ids move; otherwise only this file. */
  resolveDragFileIds: (file: FileAsset) => string[];
};

/** Shown on card hover; keep visible when row is checked (multi-select). */
const CARD_CONTROL_HOVER =
  'opacity-0 pointer-events-none transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100';

export type DriveFileCardMenuHandlers = {
  onOpenDetails: (file: FileAsset) => void;
  onCopyFile: (file: FileAsset) => void;
  onMoveFile: (file: FileAsset) => void;
  onArchive: (file: FileAsset) => void;
  onRestore: (file: FileAsset) => void;
  onRemoveFromFolder?: (file: FileAsset) => void;
  busy?: boolean;
};

export function DriveFileCheckbox({
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
      draggable={false}
      checked={checked}
      onChange={(event) => onToggleChecked(file, event.target.checked)}
      onClick={(event) => event.stopPropagation()}
      className={cn('h-4 w-4 rounded border', className)}
      aria-label={`Select ${file.displayName}`}
    />
  );
}

type DriveFileCardLayout = 'grid' | 'list' | 'tiles';

export function DriveFileCard(props: {
  file: FileAsset;
  layout: DriveFileCardLayout;
  selected: boolean;
  checked: boolean;
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  menu?: DriveFileCardMenuHandlers;
  fileDrag?: DriveFileCardDragConfig;
}) {
  const { layout, menu } = props;
  const menuBusy = menu?.busy ?? false;
  if (layout === 'list') {
    return <DriveFileCardListRow {...props} menuBusy={menuBusy} />;
  }
  if (layout === 'tiles') {
    return <DriveFileCardTileRow {...props} menuBusy={menuBusy} />;
  }
  return <DriveFileCardGrid {...props} menuBusy={menuBusy} />;
}

function DriveFileCardTileRow({
  file,
  selected,
  checked,
  onSelect,
  onToggleChecked,
  menu,
  menuBusy,
  fileDrag,
}: {
  file: FileAsset;
  selected: boolean;
  checked: boolean;
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  menu?: DriveFileCardMenuHandlers;
  menuBusy: boolean;
  fileDrag?: DriveFileCardDragConfig;
}) {
  const showMenu = Boolean(menu);
  const draggable = Boolean(fileDrag);
  const purposeLabel = file.purpose ? formatDriveLabel(file.purpose) : 'File';

  return (
    <div
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
      className={cn(
        'group relative',
        selected && 'ring-primary rounded-2xl ring-2 ring-offset-2',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div
        className={cn(
          'absolute top-2 left-2 z-10',
          CARD_CONTROL_HOVER,
          checked && 'pointer-events-auto opacity-100',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <DriveFileCheckbox
          file={file}
          checked={checked}
          onToggleChecked={onToggleChecked}
          className="border-border bg-background/95 shadow-sm"
        />
      </div>
      <DriveTileShell
        title={file.displayName}
        subtitle={purposeLabel}
        icon={
          <div className="relative size-full">
            <DriveFileCardThumbnail file={file} />
          </div>
        }
        onClick={() => onSelect(file)}
      />
      {showMenu && menu ? (
        <div className={cn('absolute top-2 right-2 z-10', CARD_CONTROL_HOVER)}>
          <FileCardActionsMenu file={file} handlers={menu} busy={menuBusy} align="end" />
        </div>
      ) : null}
    </div>
  );
}

function DriveFileCardListRow({
  file,
  selected,
  checked,
  onSelect,
  onToggleChecked,
  menu,
  menuBusy,
  fileDrag,
}: {
  file: FileAsset;
  selected: boolean;
  checked: boolean;
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  menu?: DriveFileCardMenuHandlers;
  menuBusy: boolean;
  fileDrag?: DriveFileCardDragConfig;
}) {
  const showMenu = Boolean(menu);
  const draggable = Boolean(fileDrag);
  return (
    <div
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
      className={cn(
        'border-border/70 bg-card/80 group hover:bg-muted/40 relative w-full rounded-2xl border transition-all',
        selected && 'border-primary/60 ring-primary/15 ring-2',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <button
        type="button"
        draggable={false}
        onClick={() => onSelect(file)}
        className="focus-visible:ring-ring flex w-full items-center gap-3 rounded-2xl py-3 pr-3 pl-10 text-left outline-none focus-visible:ring-2 md:pl-12"
      >
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
      <div
        className={cn(
          'absolute top-1/2 left-3 z-10 -translate-y-1/2 md:left-3',
          CARD_CONTROL_HOVER,
          checked && 'pointer-events-auto opacity-100',
        )}
      >
        <DriveFileCheckbox
          file={file}
          checked={checked}
          onToggleChecked={onToggleChecked}
          className="mt-0"
        />
      </div>
      {showMenu && menu && (
        <div className={cn('absolute top-1/2 right-1 z-10 -translate-y-1/2', CARD_CONTROL_HOVER)}>
          <FileCardActionsMenu file={file} handlers={menu} busy={menuBusy} align="end" />
        </div>
      )}
    </div>
  );
}

function DriveFileCardGrid({
  file,
  selected,
  checked,
  onSelect,
  onToggleChecked,
  menu,
  menuBusy,
  fileDrag,
}: {
  file: FileAsset;
  selected: boolean;
  checked: boolean;
  onSelect: (file: FileAsset) => void;
  onToggleChecked: (file: FileAsset, checked: boolean) => void;
  menu?: DriveFileCardMenuHandlers;
  menuBusy: boolean;
  fileDrag?: DriveFileCardDragConfig;
}) {
  const showMenu = Boolean(menu);
  const draggable = Boolean(fileDrag);
  return (
    <div
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
      className={cn(
        'border-border/70 bg-card/80 group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
        selected && 'border-primary/60 ring-primary/20 ring-2',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <button
        type="button"
        draggable={false}
        onClick={() => onSelect(file)}
        className="focus-visible:ring-ring flex min-h-0 w-full flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div className="border-border/60 relative aspect-[4/3] w-full shrink-0 border-b">
          <DriveFileCardThumbnail file={file} />
        </div>
        <div className="min-w-0 p-3">
          <h3 className="text-foreground line-clamp-2 text-sm font-semibold">{file.displayName}</h3>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {formatFileSize(file.sizeBytes)}
          </p>
        </div>
      </button>
      <div
        className={cn(
          'absolute top-2 left-2 z-10',
          CARD_CONTROL_HOVER,
          checked && 'pointer-events-auto opacity-100',
        )}
      >
        <DriveFileCheckbox
          file={file}
          checked={checked}
          onToggleChecked={onToggleChecked}
          className="bg-background/90 shadow-sm"
        />
      </div>
      {showMenu && menu && (
        <div className={cn('absolute top-2 right-2 z-10', CARD_CONTROL_HOVER)}>
          <FileCardActionsMenu file={file} handlers={menu} busy={menuBusy} align="end" />
        </div>
      )}
    </div>
  );
}

function FileCardActionsMenu({
  file,
  handlers,
  busy,
  align,
}: {
  file: FileAsset;
  handlers: DriveFileCardMenuHandlers;
  busy: boolean;
  align: 'end' | 'start';
}) {
  const archived = file.status === 'ARCHIVED';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            draggable={false}
            size="icon"
            variant="secondary"
            className="bg-background/90 text-muted-foreground size-8 shrink-0 shadow-sm backdrop-blur-sm"
            aria-label={`File actions for ${file.displayName}`}
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              props.onClick?.(e);
            }}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        )}
      />
      <DropdownMenuContent align={align} className="min-w-44" onClick={(e) => e.stopPropagation()}>
        <FileCardActionsMenuItems file={file} handlers={handlers} busy={busy} archived={archived} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FileCardActionsMenuItems({
  file,
  handlers,
  busy,
  archived,
}: {
  file: FileAsset;
  handlers: DriveFileCardMenuHandlers;
  busy: boolean;
  archived: boolean;
}) {
  return (
    <>
      <DropdownMenuItem onClick={() => handlers.onOpenDetails(file)}>
        <PanelRightOpen className="size-4" />
        Open details
      </DropdownMenuItem>
      <DropdownMenuItem disabled={busy} onClick={() => handlers.onCopyFile(file)}>
        <Copy className="size-4" />
        Copy…
      </DropdownMenuItem>
      <DropdownMenuItem disabled={busy} onClick={() => handlers.onMoveFile(file)}>
        <FolderInput className="size-4" />
        Move…
      </DropdownMenuItem>
      {handlers.onRemoveFromFolder && (
        <DropdownMenuItem
          disabled={busy}
          variant="destructive"
          onClick={() => handlers.onRemoveFromFolder?.(file)}
        >
          Remove from folder
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        disabled={busy}
        variant={archived ? 'default' : 'destructive'}
        onClick={() => (archived ? handlers.onRestore(file) : handlers.onArchive(file))}
      >
        <Archive className="size-4" />
        {archived ? 'Restore' : 'Archive'}
      </DropdownMenuItem>
    </>
  );
}
