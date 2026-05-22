'use client';

import { AlertCircle, File, Loader2 } from 'lucide-react';
import { fileExtensionLabel } from '@/features/drive/drive-file-extension';
import { cn } from '@/lib/utils';
import {
  SHEET_FILE_EXTENSION_BADGE_CLASS,
  SHEET_FILE_TILE_ICON_AREA_CLASS,
  SHEET_FILE_TILE_NAME_CLASS,
  SHEET_FILE_TILE_SHELL_CLASS,
} from './sheet-file-attachments.constants';
import type { SheetPendingUpload } from './sheet-pending-upload.types';

export function SheetPendingFileTile({
  item,
  dense = false,
}: {
  item: SheetPendingUpload;
  dense?: boolean;
}) {
  const ext = fileExtensionLabel(item.displayName);
  const isError = item.status === 'error';

  return (
    <div
      className={cn(
        SHEET_FILE_TILE_SHELL_CLASS,
        'relative',
        dense ? 'h-[4.75rem]' : 'aspect-square',
        isError && 'border-destructive/50',
      )}
      aria-busy={item.status === 'uploading'}
    >
      <span className={SHEET_FILE_TILE_ICON_AREA_CLASS}>
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt=""
            className="size-full rounded-md object-cover opacity-90"
          />
        ) : (
          <File className="text-muted-foreground size-5 stroke-[1.25]" aria-hidden />
        )}
        <span
          className={cn(
            'absolute left-1/2 -translate-x-1/2 rounded px-1 py-px',
            SHEET_FILE_EXTENSION_BADGE_CLASS,
          )}
        >
          {ext}
        </span>
        {item.status === 'uploading' ? (
          <span className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-md backdrop-blur-[1px]">
            <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden />
          </span>
        ) : null}
        {isError ? (
          <span className="bg-destructive/10 absolute inset-0 flex items-center justify-center rounded-md">
            <AlertCircle className="text-destructive size-4" aria-hidden />
          </span>
        ) : null}
      </span>
      <span className={SHEET_FILE_TILE_NAME_CLASS}>{item.displayName}</span>
    </div>
  );
}
