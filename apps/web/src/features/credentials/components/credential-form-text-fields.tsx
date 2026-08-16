'use client';

import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CredentialFormFieldLabel } from '@/features/credentials/components/credential-form-field-label';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS } from '@/features/credentials/constants/credential-vault-copy';
import { useCredentialVaultCopyFeedback } from '@/features/credentials/hooks/use-credential-vault-copy-feedback';
import { CREDENTIAL_VAULT_INPUT_IGNORE_PROPS } from '@/features/credentials/constants/credential-vault-input-props';
import { useAutofillGuard } from '@/features/credentials/hooks/use-credential-field-autofill-guard';

async function copyPlainFieldValue(value: string): Promise<boolean> {
  const text = value.trim();
  if (!text) return false;
  await navigator.clipboard.writeText(text);
  toast.success('Copied');
  return true;
}

function preventCopyButtonBlur(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export function CredentialFormPlainTextField({
  id,
  label,
  icon,
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <CredentialFormFieldLabel htmlFor={id} label={label} icon={icon} />
      <Input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...CREDENTIAL_VAULT_INPUT_IGNORE_PROPS}
      />
    </div>
  );
}

export function CredentialFormGuardedTextField({
  guardKey,
  id,
  label,
  icon,
  value,
  onChange,
  showCopy = false,
}: {
  guardKey: string;
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  showCopy?: boolean;
}) {
  const guard = useAutofillGuard(guardKey);
  const { copied, markCopied } = useCredentialVaultCopyFeedback();

  const handleCopy = () => {
    void copyPlainFieldValue(value).then((ok) => {
      if (ok) markCopied();
    });
  };

  return (
    <div className="grid gap-2">
      <CredentialFormFieldLabel htmlFor={id} label={label} icon={icon} />
      <div className="relative">
        {showCopy ? (
          <div className="absolute top-1/2 right-1 z-10 flex -translate-y-1/2 items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onMouseDown={preventCopyButtonBlur}
              onClick={handleCopy}
              aria-label={`Copy ${label}`}
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </Button>
          </div>
        ) : null}
        <Input
          id={id}
          name={id}
          value={value}
          readOnly={guard.readOnly}
          onFocus={guard.onFocus}
          onChange={(e) => {
            if (!guard.acceptChange) return;
            onChange(e.target.value);
          }}
          className={cn(
            showCopy ? 'pr-10' : undefined,
            copied ? CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS : undefined,
          )}
          {...CREDENTIAL_VAULT_INPUT_IGNORE_PROPS}
        />
      </div>
    </div>
  );
}
