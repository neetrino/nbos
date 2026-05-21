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
  const imageLike = isLikelyImage(file);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadedPreviewFileId, setLoadedPreviewFileId] = useState<string | null>(null);

  useEffect(() => {
    if (!imageLike) return;
    let cancelled = false;
    driveApi
      .getFileAssetPreviewUrl(file.id)
      .then((res) => {
        if (cancelled) return;
        const mime = res.mimeType ?? file.mimeType ?? '';
        setLoadedPreviewFileId(file.id);
        if (res.url && mime.startsWith('image/')) {
          setPreviewUrl(res.url);
        } else {
          setPreviewUrl(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedPreviewFileId(file.id);
          setPreviewUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [file.id, file.mimeType, imageLike]);

  const showLoader = imageLike && loadedPreviewFileId !== file.id;
  const showImage = imageLike && loadedPreviewFileId === file.id && Boolean(previewUrl);

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
