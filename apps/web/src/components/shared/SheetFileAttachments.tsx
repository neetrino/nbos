'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Loader2, Paperclip, Plus } from 'lucide-react';
import type { FileAsset } from '@/lib/api/drive';
import { DriveFileCard, type DriveFileCardMenuHandlers } from '@/features/drive/DriveFileCard';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
} from './detail-sheet-classes';
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

const OUTLINED_SHELL_CLASS = cn(
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
  'min-h-10 min-w-0 rounded-xl p-3',
);

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
  /** Outlined quiet field — caption + add in border notch; hides paperclip header. */
  outlinedLabel?: string;
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
  outlinedLabel,
  onUpload,
  onOpenFile,
  fileMenu,
  footer,
}: SheetFileAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const visibleFiles = files.slice(0, SHEET_FILE_TILE_LIMIT);
  const fileCount = files.length + pendingUploads.length;
  const hasFiles = loading || visibleFiles.length > 0 || pendingUploads.length > 0;
  const outlined = Boolean(outlinedLabel?.trim());
  const label = outlinedLabel?.trim() ?? '';
  const barDisabled = loading;
  const pickFiles = (picked: File[]) => {
    if (picked.length > 0) void onUpload(picked);
  };
  const openPicker = () => {
    if (!barDisabled) inputRef.current?.click();
  };

  const shell = (
    <div
      className={cn(
        outlined
          ? OUTLINED_SHELL_CLASS
          : embedded
            ? SHEET_FILE_ATTACHMENTS_EMBEDDED_CLASS
            : SHEET_FILE_ATTACHMENTS_SURFACE_CLASS,
        'min-w-0 transition-colors',
        dragOver && !barDisabled && 'ring-primary/25 ring-2',
        barDisabled && 'opacity-80',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!barDisabled) setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        pickFiles(Array.from(e.dataTransfer.files));
      }}
    >
      {!outlined ? (
        <div className={SHEET_FILE_ATTACHMENTS_HEADER_CLASS}>
          <span className={SHEET_FILE_ATTACHMENTS_TITLE_CLASS}>
            <Paperclip className={SHEET_FILE_ATTACHMENTS_CLIP_ICON_CLASS} aria-hidden />
            <span className="truncate">
              {hasFiles ? `${sectionTitle}: ${fileCount}` : sectionTitle}
            </span>
            {loading ? (
              <Loader2
                className="text-muted-foreground size-3.5 shrink-0 animate-spin"
                aria-hidden
              />
            ) : null}
          </span>
          <button
            type="button"
            className={SHEET_FILE_ATTACHMENTS_ADD_BUTTON_CLASS}
            disabled={barDisabled}
            aria-label={emptyHint ?? 'Add file'}
            onClick={openPicker}
          >
            <Plus className={SHEET_FILE_ATTACHMENTS_ADD_ICON_CLASS} aria-hidden />
          </button>
        </div>
      ) : null}
      <SheetFileAttachmentsContent
        inputRef={inputRef}
        multiple={multiple}
        pickFiles={pickFiles}
        hasFiles={hasFiles}
        loading={loading}
        visibleFiles={visibleFiles}
        pendingUploads={pendingUploads}
        cardLayout={denseTiles ? 'sheet-dense' : 'sheet'}
        onOpenFile={onOpenFile}
        fileMenu={fileMenu}
        emptyHint={outlined ? emptyHint : undefined}
        footer={footer}
      />
    </div>
  );

  if (!outlined) return shell;
  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      <button
        type="button"
        className={DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS}
        disabled={barDisabled}
        aria-label={emptyHint ?? `Add ${label} file`}
        onClick={openPicker}
      >
        <Plus size={12} aria-hidden className={DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS} />
        {label}
      </button>
      {shell}
    </div>
  );
}

function SheetFileAttachmentsContent({
  inputRef,
  multiple,
  pickFiles,
  hasFiles,
  loading,
  visibleFiles,
  pendingUploads,
  cardLayout,
  onOpenFile,
  fileMenu,
  emptyHint,
  footer,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  multiple: boolean;
  pickFiles: (picked: File[]) => void;
  hasFiles: boolean;
  loading: boolean;
  visibleFiles: FileAsset[];
  pendingUploads: SheetPendingUpload[];
  cardLayout: 'sheet' | 'sheet-dense';
  onOpenFile: (file: FileAsset) => void;
  fileMenu: (file: FileAsset) => DriveFileCardMenuHandlers;
  emptyHint?: string;
  footer?: ReactNode;
}) {
  const inset = emptyHint ? undefined : 'mt-2.5';
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        onChange={(e) => {
          pickFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      {hasFiles ? (
        loading && visibleFiles.length === 0 && pendingUploads.length === 0 ? (
          <p
            className={cn(
              'text-muted-foreground flex items-center gap-2 text-xs',
              inset ?? 'mt-3',
              SHEET_FILE_TILE_HEIGHT_CLASS,
            )}
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Loading files…
          </p>
        ) : (
          <div className={cn('flex min-w-0 flex-wrap gap-2.5', inset)}>
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
      ) : emptyHint ? (
        <p className="text-muted-foreground text-xs">{emptyHint}</p>
      ) : null}
      {footer ? (
        <div className={cn(emptyHint || hasFiles ? 'mt-2' : undefined)}>{footer}</div>
      ) : null}
    </>
  );
}
