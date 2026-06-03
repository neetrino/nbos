'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CREDENTIAL_VAULT_INPUT_IGNORE_PROPS,
  CREDENTIAL_VAULT_SECRET_DISC_CLASS,
} from '@/features/credentials/constants/credential-vault-input-props';
import { useAutofillGuard } from '@/features/credentials/hooks/use-credential-field-autofill-guard';

/** Shown when a secret exists in vault but is not loaded into the field yet. */
const STORED_SECRET_MASK = '••••••••';

export interface CredentialVaultSecretFieldProps {
  guardKey: string;
  fieldId: string;
  label: string;
  kind: 'password' | 'textarea';
  isExisting: boolean;
  hasStored: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  revealedValue?: string;
  onReveal?: () => void;
  onCopy?: () => void;
}

export function CredentialVaultSecretField({
  guardKey,
  fieldId,
  label,
  kind,
  isExisting,
  hasStored,
  draft,
  onDraftChange,
  revealedValue,
  onReveal,
  onCopy,
}: CredentialVaultSecretFieldProps) {
  const guard = useAutofillGuard(guardKey);
  const [showPlain, setShowPlain] = useState(false);

  const secretText = draft.length > 0 ? draft : (revealedValue ?? '');
  const hasStoredSecret = isExisting && hasStored;
  const awaitingReveal = hasStoredSecret && secretText.length === 0;
  const showMaskPlaceholder = awaitingReveal && !showPlain;
  const isEmpty = !hasStoredSecret && secretText.length === 0;

  useEffect(() => {
    setShowPlain(false);
  }, [guardKey]);

  const inputValue = showMaskPlaceholder ? STORED_SECRET_MASK : secretText;
  const showCopy = hasStoredSecret;
  const actionPadding = showCopy ? 'pr-20' : 'pr-10';

  const revealSecret = useCallback(() => {
    if (awaitingReveal && onReveal) {
      onReveal();
    }
    setShowPlain(true);
  }, [awaitingReveal, onReveal]);

  const handleFocus = () => {
    guard.onFocus();
    if (awaitingReveal) {
      revealSecret();
    }
  };

  const toggleVisibility = () => {
    if (!showPlain) {
      revealSecret();
      return;
    }
    setShowPlain(false);
  };

  const handleChange = (next: string) => {
    if (!guard.acceptChange) return;
    if (next === STORED_SECRET_MASK) return;
    onDraftChange(next);
  };

  const actionButtons = (
    <div
      className={cn(
        'absolute z-10 flex items-center gap-0.5',
        kind === 'textarea' ? 'top-2 right-2' : 'top-1/2 right-1 -translate-y-1/2',
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={toggleVisibility}
        aria-label={showPlain ? `Hide ${label}` : `Show ${label}`}
      >
        {showPlain ? <EyeOff size={14} /> : <Eye size={14} />}
      </Button>
      {showCopy ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCopy}
          aria-label={`Copy ${label}`}
        >
          <Copy size={14} />
        </Button>
      ) : null}
    </div>
  );

  if (kind === 'textarea') {
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldId}>{label}</Label>
        <div className="relative">
          {actionButtons}
          <Textarea
            id={fieldId}
            name={fieldId}
            value={inputValue}
            readOnly={guard.readOnly || showMaskPlaceholder}
            onFocus={handleFocus}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(
              'min-h-[120px] font-mono text-xs',
              actionPadding,
              !showPlain && inputValue.length > 0 ? CREDENTIAL_VAULT_SECRET_DISC_CLASS : null,
            )}
            placeholder={hasStoredSecret ? 'Paste new key to rotate' : 'Paste private key'}
            {...CREDENTIAL_VAULT_INPUT_IGNORE_PROPS}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        {actionButtons}
        <Input
          id={fieldId}
          name={fieldId}
          type="text"
          value={inputValue}
          readOnly={guard.readOnly || showMaskPlaceholder}
          onFocus={handleFocus}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            actionPadding,
            !showPlain && inputValue.length > 0 ? CREDENTIAL_VAULT_SECRET_DISC_CLASS : null,
          )}
          placeholder={hasStoredSecret && isEmpty ? 'Leave empty to keep current' : undefined}
          {...CREDENTIAL_VAULT_INPUT_IGNORE_PROPS}
        />
      </div>
    </div>
  );
}
