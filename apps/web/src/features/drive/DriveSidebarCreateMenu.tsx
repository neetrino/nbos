'use client';

import { useRef, type ChangeEvent } from 'react';
import { FolderPlus, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DriveSidebarCreateMenu({
  busy,
  onNewFolder,
  onFilesSelected,
  onFolderUpload,
}: {
  busy: boolean;
  onNewFolder: () => void;
  onFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onFolderUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              variant="outline"
              disabled={busy}
              className="border-border bg-background text-foreground hover:bg-muted h-12 w-full rounded-2xl border shadow-sm"
              aria-label="Create or upload"
            >
              <Plus className="size-6 shrink-0" aria-hidden />
            </Button>
          )}
        />
        <DropdownMenuContent align="start" className="min-w-[200px]">
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
