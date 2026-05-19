'use client';

import { AlertCircle, File, Loader2 } from 'lucide-react';
import { fileExtensionBadgeClass, fileExtensionLabel } from '@/features/drive/drive-file-extension';
import { cn } from '@/lib/utils';
import type { SheetPendingUpload } from './sheet-pending-upload.types';

export function SheetPendingFileTile({ item }: { item: SheetPendingUpload }) {
  const ext = fileExtensionLabel(item.displayName);
  const badgeClass = fileExtensionBadgeClass(item.displayName);
  const isError = item.status === 'error';

  return (
    <div
      className={cn(
        'border-border/70 bg-card relative flex aspect-square w-full flex-col overflow-hidden rounded-2xl border shadow-sm',
        isError && 'border-destructive/50',
      )}
      aria-busy={item.status === 'uploading'}
    >
      <span className="relative flex min-h-0 flex-1 items-center justify-center p-2">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt=""
            className="size-full rounded-lg object-cover opacity-90"
          />
        ) : (
          <File className="text-muted-foreground size-10 stroke-[1.25]" aria-hidden />
        )}
        <span
          className={cn(
            'absolute top-3 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
            badgeClass,
          )}
        >
          {ext}
        </span>
        {item.status === 'uploading' ? (
          <span className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
            <Loader2 className="text-primary size-7 animate-spin" aria-hidden />
          </span>
        ) : null}
        {isError ? (
          <span className="bg-destructive/10 absolute inset-0 flex items-center justify-center rounded-lg">
            <AlertCircle className="text-destructive size-7" aria-hidden />
          </span>
        ) : null}
      </span>
      <span className="text-foreground line-clamp-2 px-2 pb-2 text-left text-[11px] leading-tight font-medium">
        {item.displayName}
      </span>
    </div>
  );
}
