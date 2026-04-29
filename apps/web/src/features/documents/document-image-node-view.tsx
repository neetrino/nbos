'use client';

import { startTransition, useEffect, useState } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { ImageOff, Loader2 } from 'lucide-react';
import { driveApi } from '@/lib/api/drive';

export function DocumentImageNodeView(props: NodeViewProps) {
  const fileAssetId = props.node.attrs.fileAssetId as string | null | undefined;
  const alt = (props.node.attrs.alt as string) ?? '';
  const validId = typeof fileAssetId === 'string' && fileAssetId.length > 0;
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    startTransition(() => {
      setSrc(null);
      setFailed(false);
    });
    void driveApi
      .getFileAssetPreviewUrl(fileAssetId)
      .then(({ url }) => {
        if (!cancelled) {
          startTransition(() => setSrc(url));
        }
      })
      .catch(() => {
        if (!cancelled) {
          startTransition(() => setFailed(true));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fileAssetId, validId]);

  if (!validId) {
    return (
      <NodeViewWrapper className="text-muted-foreground my-2 flex items-center gap-2 text-sm">
        <ImageOff size={16} /> Missing file reference
      </NodeViewWrapper>
    );
  }

  if (failed) {
    return (
      <NodeViewWrapper className="text-muted-foreground my-2 flex items-center gap-2 text-sm">
        <ImageOff size={16} /> Image could not be loaded
      </NodeViewWrapper>
    );
  }

  if (!src) {
    return (
      <NodeViewWrapper className="text-muted-foreground my-2 flex items-center gap-2 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading image…
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-2">
      <img
        src={src}
        alt={alt}
        className="border-border max-h-80 max-w-full rounded-md border object-contain"
        draggable={false}
      />
    </NodeViewWrapper>
  );
}
