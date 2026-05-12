'use client';

import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { File, FileText, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { driveApi } from '@/lib/api/drive';
import {
  checklistAttachmentFormatLabel,
  isImageMime,
} from '@/features/checklist/checklist-attachment-format-label';
import {
  appendEvidenceFileToChecklistValue,
  CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES,
  isUuidLike,
  parseChecklistEvidenceFileAssetIds,
  removeEvidenceFileFromChecklistValue,
} from '@/features/checklist/checklist-evidence-value';
import {
  CHECKLIST_TEMPLATE_EVIDENCE_MAX_BYTES,
  CHECKLIST_EVIDENCE_FILE_ACCEPT,
  uploadEvidenceFileForChecklistTemplate,
} from '@/features/checklist/checklist-template-evidence-upload';

type UploadEvidenceType = 'FILE_LINK' | 'IMAGE_LINK' | 'DOCUMENT_LINK';

type Props = {
  itemId: string;
  templateId: string;
  evidenceType: UploadEvidenceType;
  value: string | null;
  disabled: boolean;
  onChange: (next: string | null) => void;
};

const ATTACHMENT_THUMB_CLASS =
  'border-border size-14 shrink-0 rounded-md border bg-muted object-cover';

function pickDocIcon(mime: string | null, formatLabel: string): LucideIcon {
  const m = mime?.toLowerCase() ?? '';
  if (m === 'application/pdf' || formatLabel === 'PDF') {
    return FileText;
  }
  return File;
}

function AttachedEvidenceFileRow({
  fileAssetId,
  disabled,
  busy,
  onRemove,
}: {
  fileAssetId: string;
  disabled: boolean;
  busy: boolean;
  onRemove: () => void;
}) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'err'>('loading');
  const [title, setTitle] = useState('');
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileAssetId || !isUuidLike(fileAssetId)) {
      setPhase('err');
      return;
    }
    let cancelled = false;
    setPhase('loading');
    void (async () => {
      try {
        const asset = await driveApi.getFileAsset(fileAssetId);
        const mime = asset.mimeType ?? null;
        const img = isImageMime(mime);
        const preview = img ? await driveApi.getFileAssetPreviewUrl(fileAssetId) : null;
        if (cancelled) {
          return;
        }
        setTitle(asset.displayName || asset.originalName || fileAssetId);
        setMimeType(mime);
        setOriginalName(asset.originalName);
        setPreviewUrl(preview?.url ?? null);
        setPhase('ready');
      } catch {
        if (!cancelled) {
          setPhase('err');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileAssetId]);

  const formatLabel = checklistAttachmentFormatLabel(mimeType, originalName ?? title);
  const showImageThumb = phase === 'ready' && previewUrl && isImageMime(mimeType);
  const DocIcon = pickDocIcon(mimeType, formatLabel);

  return (
    <div className="border-border/70 bg-muted/30 flex items-center gap-2.5 rounded-md border px-2.5 py-2">
      {phase === 'loading' ? (
        <div className={`${ATTACHMENT_THUMB_CLASS} flex items-center justify-center`} aria-hidden>
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : null}
      {phase === 'err' ? (
        <div className={`${ATTACHMENT_THUMB_CLASS} flex items-center justify-center`} aria-hidden>
          <File className="text-muted-foreground size-6" />
        </div>
      ) : null}
      {showImageThumb ? (
        <img src={previewUrl} alt="" className={ATTACHMENT_THUMB_CLASS} width={56} height={56} />
      ) : null}
      {phase === 'ready' && !showImageThumb ? (
        <div
          className={`${ATTACHMENT_THUMB_CLASS} flex flex-col items-center justify-center gap-0.5 px-1`}
          aria-hidden
        >
          <DocIcon className="text-muted-foreground size-6" />
          <span className="text-muted-foreground max-w-full truncate text-[0.625rem] font-semibold tracking-tight uppercase">
            {formatLabel}
          </span>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-xs leading-tight font-medium">
          {phase === 'loading' ? 'Loading…' : phase === 'err' ? fileAssetId : title}
        </p>
        {phase === 'ready' && !showImageThumb ? (
          <p className="text-muted-foreground mt-0.5 text-[0.6875rem]">{formatLabel}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground h-7 shrink-0 px-2 text-xs"
        disabled={disabled || busy}
        onClick={onRemove}
      >
        Remove
      </Button>
    </div>
  );
}

export function ChecklistDraftEvidenceFileField({
  itemId,
  templateId,
  evidenceType,
  value,
  disabled,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileIds = parseChecklistEvidenceFileAssetIds(value);
  const atFileLimit = fileIds.length >= CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES;

  const inputId = `checklist-evidence-file-${itemId}`;
  const accept = CHECKLIST_EVIDENCE_FILE_ACCEPT[evidenceType];

  async function onPickFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const { fileAssetId } = await uploadEvidenceFileForChecklistTemplate(
        templateId,
        file,
        CHECKLIST_TEMPLATE_EVIDENCE_MAX_BYTES,
      );
      const next = appendEvidenceFileToChecklistValue(value, fileAssetId);
      onChange(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled || busy || atFileLimit}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void onPickFile(file);
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 gap-2"
          disabled={disabled || busy || atFileLimit}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-3.5" aria-hidden />
          )}
          {fileIds.length > 0 ? 'Add file' : 'Upload file'}
        </Button>
        {fileIds.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-9 text-xs"
            disabled={disabled || busy}
            onClick={() => onChange(null)}
          >
            Clear all
          </Button>
        ) : null}
      </div>
      {fileIds.length > 0 ? (
        <ul className="space-y-1.5">
          {fileIds.map((id) => (
            <li key={id}>
              <AttachedEvidenceFileRow
                fileAssetId={id}
                disabled={disabled}
                busy={busy}
                onRemove={() => onChange(removeEvidenceFileFromChecklistValue(value, id))}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-muted-foreground text-xs">
        Up to {CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES} files in Drive, linked to this template. Max{' '}
        {Math.round(CHECKLIST_TEMPLATE_EVIDENCE_MAX_BYTES / (1024 * 1024))} MB per file.
      </p>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
