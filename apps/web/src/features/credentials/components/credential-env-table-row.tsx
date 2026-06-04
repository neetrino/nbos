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
  maskValue,
  valueMaskDisplay,
  valueEmptyPlaceholder,
  onKeyChange,
  onValueChange,
  onPaste,
  onRemove,
  onCopy,
}: {
  row: EnvBundleEntry;
  /** When true, value cell shows mask dots (stored secret, not revealed in form). */
  maskValue: boolean;
  valueMaskDisplay: string;
  valueEmptyPlaceholder: string;
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

  const copiedFieldClass = copied ? CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS : undefined;

  return (
    <div className="border-border grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-t px-3 py-2">
      <Input
        value={row.key}
        onChange={(e) => onKeyChange(e.target.value)}
        onPaste={onPaste}
        placeholder="KEY or paste .env"
        className={cn('font-mono text-xs', copiedFieldClass)}
      />
      <Input
        value={maskValue ? valueMaskDisplay : row.value}
        onChange={(e) => onValueChange(e.target.value)}
        onPaste={onPaste}
        placeholder={maskValue ? undefined : valueEmptyPlaceholder}
        className={cn(
          'font-mono text-xs',
          maskValue ? 'text-muted-foreground' : undefined,
          copiedFieldClass,
        )}
        disabled={maskValue}
        readOnly={maskValue}
      />
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onMouseDown={preventCopyButtonBlur}
          onClick={handleCopy}
          disabled={maskValue && !row.key.trim()}
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
