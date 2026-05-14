'use client';

import { Folder, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DriveFolder } from '@/lib/api/drive';
import { cn } from '@/lib/utils';
import { formatDriveDate } from './drive-format';

const FOLDER_TABLE_ROW_GRID =
  'grid w-full grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px_44px] gap-3';

const FOLDER_TABLE_MAIN_GRID =
  'grid grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px] gap-3';

/** Folder card: overflow menu appears on card hover / focus-within. */
const FOLDER_CARD_MENU_HOVER =
  'opacity-0 pointer-events-none transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100';

const FOLDER_CARD_ICON_CLASS =
  'text-foreground/80 dark:text-foreground/70 h-[min(5.25rem,47cqh)] w-[min(5.25rem,47cqw)] shrink-0';

export function DriveFolderCardRow({
  folder,
  compact,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  folder: DriveFolder;
  compact: boolean;
  onOpenFolder: (folder: DriveFolder) => void;
  onRenameFolder?: (folder: DriveFolder) => void;
  onDeleteFolder?: (folder: DriveFolder) => void;
}) {
  const showMenu = Boolean(onRenameFolder || onDeleteFolder);

  if (compact) {
    return (
      <div
        className={cn(
          'border-border/60 bg-card/90 hover:border-primary/25 group hover:bg-card relative flex w-full items-center gap-2 border shadow-sm transition-colors',
          'rounded-xl p-2.5',
        )}
      >
        <button
          type="button"
          onClick={() => onOpenFolder(folder)}
          className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2"
        >
          <Folder className="text-muted-foreground size-5 shrink-0" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{folder.name}</p>
            <p className="text-muted-foreground text-[11px] leading-tight">{folder.space}</p>
          </div>
        </button>
        {showMenu && (
          <div className={cn('shrink-0', FOLDER_CARD_MENU_HOVER)}>
            <FolderOverflowMenu
              folder={folder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-border/60 bg-card/90 hover:border-primary/25 group hover:bg-card @container relative flex aspect-square w-full flex-col overflow-hidden border shadow-sm transition-colors',
        'rounded-2xl',
      )}
    >
      <button
        type="button"
        onClick={() => onOpenFolder(folder)}
        className="focus-visible:ring-ring flex min-h-0 flex-1 flex-col px-3 pt-10 pb-3 text-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Folder className={FOLDER_CARD_ICON_CLASS} strokeWidth={1.35} aria-hidden />
        </div>
        <div className="min-h-0 shrink-0 space-y-0.5 pt-1">
          <p className="text-foreground line-clamp-2 text-sm font-semibold">{folder.name}</p>
          <p className="text-muted-foreground text-[11px] leading-tight tracking-wide uppercase">
            {folder.space}
          </p>
        </div>
      </button>
      {showMenu && (
        <div className={cn('absolute top-2 right-2 z-10', FOLDER_CARD_MENU_HOVER)}>
          <FolderOverflowMenu
            folder={folder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
          />
        </div>
      )}
    </div>
  );
}

function FolderOverflowMenu({
  folder,
  onRenameFolder,
  onDeleteFolder,
}: {
  folder: DriveFolder;
  onRenameFolder?: (folder: DriveFolder) => void;
  onDeleteFolder?: (folder: DriveFolder) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            size="icon"
            variant="secondary"
            className="bg-background/90 text-muted-foreground size-8 shrink-0 shadow-sm backdrop-blur-sm"
            aria-label={`Folder actions for ${folder.name}`}
            onClick={(e) => {
              e.stopPropagation();
              props.onClick?.(e);
            }}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="min-w-40" onClick={(e) => e.stopPropagation()}>
        {onRenameFolder && (
          <DropdownMenuItem onClick={() => onRenameFolder(folder)}>Rename</DropdownMenuItem>
        )}
        {onDeleteFolder && (
          <DropdownMenuItem variant="destructive" onClick={() => onDeleteFolder(folder)}>
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DriveFolderTableRow({
  folder,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  folder: DriveFolder;
  onOpenFolder: (folder: DriveFolder) => void;
  onRenameFolder?: (folder: DriveFolder) => void;
  onDeleteFolder?: (folder: DriveFolder) => void;
}) {
  const showMenu = Boolean(onRenameFolder || onDeleteFolder);
  return (
    <div className={cn('hover:bg-muted/50 px-4 py-3', FOLDER_TABLE_ROW_GRID)}>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          FOLDER_TABLE_MAIN_GRID,
          'focus-visible:ring-ring col-span-6 cursor-pointer text-left text-sm outline-none focus-visible:ring-2',
        )}
        onClick={() => onOpenFolder(folder)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenFolder(folder);
          }
        }}
      >
        <Folder className="size-4 self-center text-amber-600 dark:text-amber-400" />
        <span className="truncate font-medium">{folder.name}</span>
        <span className="text-muted-foreground text-xs">Folder</span>
        <span className="text-muted-foreground text-xs">{folder.space}</span>
        <span className="text-muted-foreground text-xs">{formatDriveDate(folder.updatedAt)}</span>
        <span />
      </div>
      {showMenu ? (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button
                  {...props}
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground size-8"
                  aria-label={`Folder actions for ${folder.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onClick?.(e);
                  }}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              )}
            />
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {onRenameFolder && (
                <DropdownMenuItem onClick={() => onRenameFolder(folder)}>Rename</DropdownMenuItem>
              )}
              {onDeleteFolder && (
                <DropdownMenuItem variant="destructive" onClick={() => onDeleteFolder(folder)}>
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <span />
      )}
    </div>
  );
}
