'use client';

import { type ClipboardEvent, type MouseEvent } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import type { EnvBundleEntry } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS } from '@/features/credentials/constants/credential-vault-copy';
import { useCredentialVaultCopyFeedback } from '@/features/credentials/hooks/use-credential-vault-copy-feedback';
import { cn } from '@/lib/utils';

function preventCopyButtonBlur(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export function CredentialEnvTableRow({
  row,
  maskedValue,
  showMasked,
  onKeyChange,
  onValueChange,
  onPaste,
  onRemove,
  onCopy,
}: {
  row: EnvBundleEntry;
  maskedValue: string;
  showMasked: boolean;
  onKeyChange: (key: string) => void;
  onValueChange: (value: string) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onCopy: () => void;
}) {
  const { copied, markCopied } = useCredentialVaultCopyFeedback();

  const handleCopy = () => {
    void onCopy();
    markCopied();
  };

  return (
    <div className="border-border grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-t px-3 py-2">
      <Input
        value={row.key}
        onChange={(e) => onKeyChange(e.target.value)}
        onPaste={onPaste}
        placeholder="KEY or paste .env"
        className="font-mono text-xs"
      />
      <Input
        value={showMasked ? '••••••••' : maskedValue}
        onChange={(e) => onValueChange(e.target.value)}
        onPaste={onPaste}
        placeholder="value"
        className={cn(
          'font-mono text-xs',
          copied ? CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS : undefined,
        )}
        disabled={showMasked}
        readOnly={showMasked}
      />
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onMouseDown={preventCopyButtonBlur}
          onClick={handleCopy}
          disabled={showMasked && !row.key.trim()}
          aria-label="Copy line"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove line"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}
