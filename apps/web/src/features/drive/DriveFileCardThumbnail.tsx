'use client';

import { useEffect, useState } from 'react';
import { File, FileArchive, FileImage, FileText, Loader2 } from 'lucide-react';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { cn } from '@/lib/utils';

function isLikelyImage(file: FileAsset): boolean {
  if (file.fileType === 'IMAGE') return true;
  const mime = file.mimeType ?? '';
  return mime.startsWith('image/');
}

function FileTypeGlyph({ fileType, className }: { fileType: string; className?: string }) {
  if (fileType === 'IMAGE') return <FileImage className={className} />;
  if (fileType === 'ARCHIVE') return <FileArchive className={className} />;
  if (fileType === 'DOCUMENT' || fileType === 'SPREADSHEET') {
    return <FileText className={className} />;
  }
  return <File className={className} />;
}

/**
 * Small preview for Drive cards: loads presigned image URL when the asset is image-like.
 */
export function DriveFileCardThumbnail({
  file,
  className,
}: {
  file: FileAsset;
  className?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready'>('idle');

  useEffect(() => {
    if (!isLikelyImage(file)) {
      setPreviewUrl(null);
      setPhase('ready');
      return;
    }
    setPreviewUrl(null);
    setPhase('loading');
    let cancelled = false;
    driveApi
      .getFileAssetPreviewUrl(file.id)
      .then((res) => {
        if (cancelled) return;
        const mime = res.mimeType ?? file.mimeType ?? '';
        if (res.url && mime.startsWith('image/')) {
          setPreviewUrl(res.url);
        } else {
          setPreviewUrl(null);
        }
        setPhase('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null);
          setPhase('ready');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [file.id, file.fileType, file.mimeType]);

  const showLoader = phase === 'loading';
  const showImage = Boolean(previewUrl);

  return (
    <div
      className={cn(
        'bg-muted/80 text-muted-foreground relative flex size-full items-center justify-center overflow-hidden',
        className,
      )}
    >
      {showLoader ? <Loader2 className="size-6 animate-spin opacity-60" aria-hidden /> : null}
      {showImage ? (
        <img
          src={previewUrl!}
          alt={file.displayName}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : null}
      {!showLoader && !showImage ? (
        <FileTypeGlyph fileType={file.fileType} className="size-8 opacity-50" />
      ) : null}
    </div>
  );
}
