'use client';

import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import type { FileAsset } from '@/lib/api/drive';
import { DriveFileCard, type DriveFileCardMenuHandlers } from '@/features/drive/DriveFileCard';
import { cn } from '@/lib/utils';
import { SHEET_FILE_GRID_COLUMNS, SHEET_FILE_TILE_LIMIT } from './sheet-file-attachments.constants';
import { SheetPendingFileTile } from './SheetPendingFileTile';
import type { SheetPendingUpload } from './sheet-pending-upload.types';

export interface SheetFileAttachmentsProps {
  files: FileAsset[];
  pendingUploads?: SheetPendingUpload[];
  loading?: boolean;
  multiple?: boolean;
  uploadBarLabel?: string;
  onUpload: (files: File[]) => void | Promise<void>;
  onOpenFile: (file: FileAsset) => void;
  fileMenu: (file: FileAsset) => DriveFileCardMenuHandlers;
  footer?: ReactNode;
}

export function SheetFileAttachments({
  files,
  pendingUploads = [],
  loading = false,
  multiple = true,
  uploadBarLabel = 'Drag a file here or click to choose',
  onUpload,
  onOpenFile,
  fileMenu,
  footer,
}: SheetFileAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const visibleFiles = files.slice(0, SHEET_FILE_TILE_LIMIT);
  const showGrid = loading || visibleFiles.length > 0 || pendingUploads.length > 0;
  const barDisabled = loading;

  const pickFiles = (picked: File[]) => {
    if (picked.length === 0) return;
    void onUpload(picked);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!barDisabled) setDragOver(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragOver(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    pickFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div className="space-y-3">
      {showGrid ? (
        loading && visibleFiles.length === 0 && pendingUploads.length === 0 ? (
          <p className="text-muted-foreground flex min-h-[7.25rem] items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading files…
          </p>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${SHEET_FILE_GRID_COLUMNS}, minmax(0, 1fr))`,
            }}
          >
            {pendingUploads.map((item) => (
              <SheetPendingFileTile key={item.localId} item={item} />
            ))}
            {visibleFiles.map((file) => (
              <div key={file.id} className="aspect-square min-w-0">
                <DriveFileCard
                  file={file}
                  layout="sheet"
                  selected={false}
                  checked={false}
                  onSelect={onOpenFile}
                  onToggleChecked={() => undefined}
                  menu={fileMenu(file)}
                />
              </div>
            ))}
          </div>
        )
      ) : null}

      <div
        role="button"
        tabIndex={0}
        aria-label={uploadBarLabel}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'flex min-h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-2.5 text-center transition-colors',
          dragOver
            ? 'border-primary/50 bg-primary/5'
            : 'border-stone-200 bg-stone-50/60 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900/30 dark:hover:border-stone-600',
          barDisabled && 'pointer-events-none opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          onChange={(event) => {
            pickFiles(Array.from(event.target.files ?? []));
            event.target.value = '';
          }}
        />
        <span className="text-muted-foreground text-sm">{uploadBarLabel}</span>
      </div>

      {footer}
    </div>
  );
}
