'use client';

import { useState, type DragEvent } from 'react';
import { Send, X } from 'lucide-react';
import { useSheetMessengerPalette } from './sheet-messenger-palette';

const PREVIEW_SHELL =
  'bg-card text-foreground border-border flex w-full flex-col overflow-hidden rounded-[28px] border shadow-xl';

export type AttachPreviewItem = { name: string; previewUrl: string | null };

export function SheetAttachPreview({
  items,
  uploading,
  error,
  onClose,
  onAdd,
  onRemove,
  onSend,
}: {
  items: AttachPreviewItem[];
  uploading: boolean;
  error: string | null;
  onClose: () => void;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onSend: (caption: string) => void;
}) {
  const palette = useSheetMessengerPalette();
  const [caption, setCaption] = useState('');
  const [over, setOver] = useState(false);
  const title = items.length === 1 ? '1 media' : `${items.length} media`;
  return (
    <div
      className={`${PREVIEW_SHELL} ${over ? 'ring-primary ring-2' : ''}`}
      onDragOver={(event) => keepDrop(event, setOver)}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => takeDrop(event, setOver, onAdd)}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          aria-label="Cancel attachment"
          onClick={onClose}
          className="bg-muted text-foreground flex size-10 items-center justify-center rounded-full"
        >
          <X size={18} />
        </button>
        <p className="text-sm font-medium">{title}</p>
        <span className="size-10" />
      </div>
      <MediaStrip items={items} onRemove={onRemove} />
      {error ? <p className="px-4 pt-2 text-xs text-red-600">{error}</p> : null}
      <div className="flex items-end gap-2 px-3 py-3">
        <input
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Add a caption..."
          disabled={uploading}
          className="bg-muted text-foreground placeholder:text-muted-foreground h-11 min-w-0 flex-1 rounded-full px-4 text-sm outline-none"
        />
        <button
          type="button"
          aria-label="Send file"
          disabled={uploading}
          onClick={() => onSend(caption)}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-60 ${palette.send}`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function keepDrop(event: DragEvent<HTMLDivElement>, setOver: (over: boolean) => void): void {
  event.preventDefault();
  setOver(true);
}

function takeDrop(
  event: DragEvent<HTMLDivElement>,
  setOver: (over: boolean) => void,
  onAdd: (files: File[]) => void,
): void {
  event.preventDefault();
  setOver(false);
  const dropped = [...event.dataTransfer.files];
  if (dropped.length > 0) onAdd(dropped);
}

function MediaStrip({
  items,
  onRemove,
}: {
  items: AttachPreviewItem[];
  onRemove: (index: number) => void;
}) {
  const several = items.length > 1;
  return (
    <div className={`mx-3 flex gap-1 ${several ? 'h-36' : 'h-64'}`}>
      {items.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="group bg-muted relative min-w-0 flex-1 overflow-hidden rounded-2xl"
        >
          {item.previewUrl ? (
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <p className="text-foreground flex h-full items-center justify-center px-2 text-center text-[11px]">
              {item.name}
            </p>
          )}
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove(index)}
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
