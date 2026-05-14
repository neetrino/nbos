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
  return (
    <div
      className={cn(
        'border-border/60 bg-card/90 hover:border-primary/25 group hover:bg-card relative flex w-full items-center gap-2 border shadow-sm transition-colors',
        compact ? 'rounded-xl p-2.5' : 'rounded-2xl p-3',
      )}
    >
      <button
        type="button"
        onClick={() => onOpenFolder(folder)}
        className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2"
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 text-amber-800 dark:from-amber-400/15 dark:to-amber-500/5 dark:text-amber-300',
            compact ? 'size-9' : 'size-10',
          )}
        >
          <Folder className={compact ? 'size-[1.05rem]' : 'size-[1.15rem]'} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">{folder.name}</p>
          <p className="text-muted-foreground text-[11px] leading-tight">{folder.space}</p>
        </div>
      </button>
      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                type="button"
                size="icon"
                variant="ghost"
                className="text-muted-foreground size-9 shrink-0 rounded-xl"
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
          <DropdownMenuContent
            align="end"
            className="min-w-40"
            onClick={(e) => e.stopPropagation()}
          >
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
      )}
    </div>
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
