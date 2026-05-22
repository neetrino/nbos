'use client';

import { AlertCircle, File, Loader2 } from 'lucide-react';
import { fileExtensionBadgeClass, fileExtensionLabel } from '@/features/drive/drive-file-extension';
import { cn } from '@/lib/utils';
import type { SheetPendingUpload } from './sheet-pending-upload.types';

export function SheetPendingFileTile({
  item,
  dense = false,
}: {
  item: SheetPendingUpload;
  dense?: boolean;
}) {
  const ext = fileExtensionLabel(item.displayName);
  const badgeClass = fileExtensionBadgeClass(item.displayName);
  const isError = item.status === 'error';

  return (
    <div
      className={cn(
        'border-border/70 bg-card relative flex w-full flex-col overflow-hidden border shadow-sm',
        dense ? 'h-[4.75rem] rounded-lg' : 'aspect-square rounded-2xl',
        isError && 'border-destructive/50',
      )}
      aria-busy={item.status === 'uploading'}
    >
      <span
        className={cn(
          'relative flex min-h-0 flex-1 items-center justify-center',
          dense ? 'p-0.5' : 'p-2',
        )}
      >
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt=""
            className={cn('size-full object-cover opacity-90', dense ? 'rounded-md' : 'rounded-lg')}
          />
        ) : (
          <File
            className={cn('text-muted-foreground stroke-[1.25]', dense ? 'size-5' : 'size-10')}
            aria-hidden
          />
        )}
        <span
          className={cn(
            'absolute left-1/2 -translate-x-1/2 rounded font-bold tracking-wide',
            dense ? 'top-0.5 px-1 py-px text-[8px]' : 'top-3 px-1.5 py-0.5 text-[10px]',
            badgeClass,
          )}
        >
          {ext}
        </span>
        {item.status === 'uploading' ? (
          <span className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
            <Loader2
              className={cn('text-primary animate-spin', dense ? 'size-4' : 'size-7')}
              aria-hidden
            />
          </span>
        ) : null}
        {isError ? (
          <span className="bg-destructive/10 absolute inset-0 flex items-center justify-center rounded-lg">
            <AlertCircle
              className={cn('text-destructive', dense ? 'size-4' : 'size-7')}
              aria-hidden
            />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'text-foreground line-clamp-2 text-left leading-tight font-medium',
          dense ? 'px-1 pb-0.5 text-[9px]' : 'px-2 pb-2 text-[11px]',
        )}
      >
        {item.displayName}
      </span>
    </div>
  );
}
