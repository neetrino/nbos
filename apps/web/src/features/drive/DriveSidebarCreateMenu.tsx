'use client';

import { useRef, type ChangeEvent } from 'react';
import { Ban, FolderPlus, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function DriveSidebarCreateMenu({
  busy,
  entityContextReady = true,
  menuMode = 'storage',
  entityScopedFolders = false,
  onNewFolder,
  onFilesSelected,
  onFolderUpload,
}: {
  busy: boolean;
  /** When false, trigger stays disabled (e.g. system library without entity pick). */
  entityContextReady?: boolean;
  /** `library-entity`: uploads linked to a record; new folder when `entityScopedFolders`. */
  menuMode?: 'storage' | 'library-entity';
  /** When true inside library-entity, New folder creates scoped entity folders. */
  entityScopedFolders?: boolean;
  onNewFolder: () => void;
  onFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onFolderUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const canCreate = !busy && entityContextReady;

  return (
    <div className="mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              variant="outline"
              disabled={!canCreate}
              className={cn(
                'border-border bg-background hover:bg-muted h-12 w-full rounded-2xl border shadow-sm',
                canCreate
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-background disabled:opacity-100',
              )}
              aria-label={
                canCreate
                  ? 'Create or upload'
                  : 'Create and upload unavailable — select a record first'
              }
              title={
                canCreate ? undefined : 'Select a record in the list to upload or create folders'
              }
            >
              {canCreate ? (
                <Plus className="size-6 shrink-0" aria-hidden />
              ) : (
                <Ban className="size-6 shrink-0" aria-hidden />
              )}
            </Button>
          )}
        />
        <DropdownMenuContent align="start" className="min-w-[200px]">
          {menuMode === 'storage' || entityScopedFolders ? (
            <>
              <DropdownMenuItem onClick={() => onNewFolder()}>
                <FolderPlus className="size-4" aria-hidden />
                New folder
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={busy}
                onClick={() => {
                  filesInputRef.current?.click();
                }}
              >
                <Upload className="size-4" aria-hidden />
                Upload files
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={busy}
                onClick={() => {
                  folderInputRef.current?.click();
                }}
              >
                <FolderPlus className="size-4" aria-hidden />
                Upload folder
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                disabled={busy || !entityContextReady}
                onClick={() => {
                  filesInputRef.current?.click();
                }}
              >
                <Upload className="size-4" aria-hidden />
                Upload files
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={busy || !entityContextReady}
                onClick={() => {
                  folderInputRef.current?.click();
                }}
              >
                <FolderPlus className="size-4" aria-hidden />
                Upload folder
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={filesInputRef}
        type="file"
        multiple
        className="hidden"
        disabled={busy}
        onChange={onFilesSelected}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        disabled={busy}
        onChange={onFolderUpload}
        {...{ webkitdirectory: '', directory: '' }}
      />
    </div>
  );
}
