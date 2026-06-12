'use client';

import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Loader2, Paperclip, Plus } from 'lucide-react';
import type { FileAsset } from '@/lib/api/drive';
import { DriveFileCard, type DriveFileCardMenuHandlers } from '@/features/drive/DriveFileCard';
import { cn } from '@/lib/utils';
import {
  SHEET_FILE_ATTACHMENTS_ADD_BUTTON_CLASS,
  SHEET_FILE_ATTACHMENTS_ADD_ICON_CLASS,
  SHEET_FILE_ATTACHMENTS_CLIP_ICON_CLASS,
  SHEET_FILE_ATTACHMENTS_EMBEDDED_CLASS,
  SHEET_FILE_ATTACHMENTS_HEADER_CLASS,
  SHEET_FILE_ATTACHMENTS_SURFACE_CLASS,
  SHEET_FILE_ATTACHMENTS_TITLE_CLASS,
  SHEET_FILE_SECTION_TITLE,
  SHEET_FILE_TILE_HEIGHT_CLASS,
  SHEET_FILE_TILE_LIMIT,
  SHEET_FILE_TILE_WIDTH_CLASS,
} from './sheet-file-attachments.constants';
import { SheetPendingFileTile } from './SheetPendingFileTile';
import type { SheetPendingUpload } from './sheet-pending-upload.types';

export interface SheetFileAttachmentsProps {
  files: FileAsset[];
  pendingUploads?: SheetPendingUpload[];
  loading?: boolean;
  multiple?: boolean;
  /** Default 4; use {@link SHEET_FILE_GRID_COLUMNS_DENSE} with `denseTiles` for task sheet. */
  gridColumns?: number;
  /** Smaller tiles and tighter grid (8–10 per row). */
  denseTiles?: boolean;
  /** Parent already wraps this block in a sheet card — skip outer surface. */
  embedded?: boolean;
  sectionTitle?: string;
  /** Shown under the header when there are no files yet (optional). */
  emptyHint?: string;
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
  denseTiles = false,
  embedded = false,
  sectionTitle = SHEET_FILE_SECTION_TITLE,
  emptyHint,
  onUpload,
  onOpenFile,
  fileMenu,
  footer,
}: SheetFileAttachmentsProps) {
  const cardLayout = denseTiles ? 'sheet-dense' : 'sheet';
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const visibleFiles = files.slice(0, SHEET_FILE_TILE_LIMIT);
  const fileCount = files.length + pendingUploads.length;
  const hasFiles = loading || visibleFiles.length > 0 || pendingUploads.length > 0;
  const hint = emptyHint;
  const barDisabled = loading;
  const headerLabel = hasFiles ? `${sectionTitle}: ${fileCount}` : sectionTitle;

  const pickFiles = (picked: File[]) => {
    if (picked.length === 0) return;
    void onUpload(picked);
  };

  const openPicker = () => {
    if (barDisabled) return;
    inputRef.current?.click();
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
    <div
      className={cn(
        embedded ? SHEET_FILE_ATTACHMENTS_EMBEDDED_CLASS : SHEET_FILE_ATTACHMENTS_SURFACE_CLASS,
        'min-w-0 transition-colors',
        dragOver && !barDisabled && 'ring-primary/25 ring-2',
        barDisabled && 'opacity-80',
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={SHEET_FILE_ATTACHMENTS_HEADER_CLASS}>
        <span className={SHEET_FILE_ATTACHMENTS_TITLE_CLASS}>
          <Paperclip className={SHEET_FILE_ATTACHMENTS_CLIP_ICON_CLASS} aria-hidden />
          <span className="truncate">{headerLabel}</span>
          {loading ? (
            <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : null}
        </span>
        <button
          type="button"
          className={SHEET_FILE_ATTACHMENTS_ADD_BUTTON_CLASS}
          disabled={barDisabled}
          aria-label={hint ?? 'Add file'}
          onClick={openPicker}
        >
          <Plus className={SHEET_FILE_ATTACHMENTS_ADD_ICON_CLASS} aria-hidden />
        </button>
      </div>

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

      {hasFiles ? (
        loading && visibleFiles.length === 0 && pendingUploads.length === 0 ? (
          <p
            className={cn(
              'text-muted-foreground mt-3 flex items-center gap-2 text-xs',
              SHEET_FILE_TILE_HEIGHT_CLASS,
            )}
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Loading files…
          </p>
        ) : (
          <div className="mt-2.5 flex min-w-0 flex-wrap gap-2.5">
            {pendingUploads.map((item) => (
              <div
                key={item.localId}
                className={cn(
                  'min-w-0 shrink-0',
                  SHEET_FILE_TILE_WIDTH_CLASS,
                  SHEET_FILE_TILE_HEIGHT_CLASS,
                )}
              >
                <SheetPendingFileTile item={item} />
              </div>
            ))}
            {visibleFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'min-w-0 shrink-0',
                  SHEET_FILE_TILE_WIDTH_CLASS,
                  SHEET_FILE_TILE_HEIGHT_CLASS,
                )}
              >
                <DriveFileCard
                  file={file}
                  layout={cardLayout}
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

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}
