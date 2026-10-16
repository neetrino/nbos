'use client';

import { useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MailComposeAttachmentItem } from './use-mail-compose-attachments';

export interface MailComposeAttachmentFieldProps {
  items: MailComposeAttachmentItem[];
  disabled?: boolean;
  onAdd: (files: File[]) => void | Promise<void>;
  onRemove: (localId: string) => void;
}

export function MailComposeAttachmentField({
  items,
  disabled = false,
  onAdd,
  onRemove,
}: MailComposeAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip size={14} aria-hidden />
          Attach files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          disabled={disabled}
          aria-label="Attach files"
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? []);
            event.target.value = '';
            if (picked.length > 0) {
              void onAdd(picked);
            }
          }}
        />
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <AttachmentChip
              key={item.localId}
              item={item}
              disabled={disabled}
              onRemove={onRemove}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AttachmentChip({
  item,
  disabled,
  onRemove,
}: {
  item: MailComposeAttachmentItem;
  disabled: boolean;
  onRemove: (localId: string) => void;
}) {
  const status =
    item.status === 'uploading' ? ' · Uploading…' : item.status === 'failed' ? ' · Failed' : '';
  return (
    <Badge variant={item.status === 'failed' ? 'destructive' : 'secondary'} className="gap-1">
      {item.fileName}
      {status}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground"
        aria-label={`Remove ${item.fileName}`}
        disabled={disabled}
        onClick={() => onRemove(item.localId)}
      >
        <X size={12} aria-hidden />
      </button>
    </Badge>
  );
}
