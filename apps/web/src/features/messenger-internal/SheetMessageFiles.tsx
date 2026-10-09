'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { driveApi } from '@/lib/api/drive';
import type { MessengerViewMessage } from '@/features/messenger/messenger-message-mapper';

type FileCard = { name: string; imageUrl: string | null };

export function SheetMessageFiles({
  message,
  light = false,
}: {
  message: MessengerViewMessage;
  light?: boolean;
}) {
  if (message.attachments.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {message.attachments.map((attachment) => (
        <FileCardView key={attachment.id} fileAssetId={attachment.fileAssetId} light={light} />
      ))}
    </div>
  );
}

function FileCardView({ fileAssetId, light }: { fileAssetId: string; light: boolean }) {
  const card = useFileCard(fileAssetId);
  const tone = light ? 'bg-white/15 text-white' : 'bg-muted text-foreground';
  if (card?.imageUrl) {
    return (
      <a
        href={card.imageUrl}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl"
      >
        <img src={card.imageUrl} alt={card.name} className="max-h-52 w-full object-cover" />
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={() => void openFile(fileAssetId)}
      className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left ${tone}`}
    >
      <FileText size={18} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{card?.name ?? 'File'}</span>
    </button>
  );
}

function useFileCard(fileAssetId: string): FileCard | null {
  const [card, setCard] = useState<FileCard | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadFileCard(fileAssetId).then((next) => {
      if (!cancelled) setCard(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fileAssetId]);
  return card;
}

async function loadFileCard(fileAssetId: string): Promise<FileCard> {
  try {
    const asset = await driveApi.getFileAsset(fileAssetId);
    const image = asset.mimeType?.startsWith('image/') === true;
    if (!image) return { name: asset.displayName, imageUrl: null };
    const preview = await driveApi.getFileAssetPreviewUrl(fileAssetId);
    return { name: asset.displayName, imageUrl: preview.url };
  } catch {
    return { name: 'File', imageUrl: null };
  }
}

async function openFile(fileAssetId: string): Promise<void> {
  const preview = await driveApi.getFileAssetPreviewUrl(fileAssetId);
  window.open(preview.url, '_blank', 'noopener,noreferrer');
}
