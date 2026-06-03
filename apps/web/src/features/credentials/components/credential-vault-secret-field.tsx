'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CREDENTIAL_VAULT_INPUT_IGNORE_PROPS,
  CREDENTIAL_VAULT_SECRET_DISC_CLASS,
} from '@/features/credentials/constants/credential-vault-input-props';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS } from '@/features/credentials/constants/credential-vault-copy';
import { useAutofillGuard } from '@/features/credentials/hooks/use-credential-field-autofill-guard';
import { useCredentialVaultCopyFeedback } from '@/features/credentials/hooks/use-credential-vault-copy-feedback';

/** Shown when a secret exists in vault but is not loaded into the field yet. */
const STORED_SECRET_MASK = '••••••••';

/** Keeps focus on the control when using adjacent icon buttons (avoids autofill flashes). */
function preventControlBlur(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

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
  onCopy?: () => void | Promise<boolean>;
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
  const { copied, markCopied } = useCredentialVaultCopyFeedback();
  const [showPlain, setShowPlain] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingEditAfterRevealRef = useRef(false);

  const secretText = draft.length > 0 ? draft : (revealedValue ?? '');
  const hasStoredSecret = isExisting && hasStored;
  const awaitingReveal = hasStoredSecret && secretText.length === 0;
  const showMaskPlaceholder = awaitingReveal;
  const isEmpty = !hasStoredSecret && secretText.length === 0;

  useEffect(() => {
    setShowPlain(false);
    pendingEditAfterRevealRef.current = false;
  }, [guardKey]);

  const inputValue = showMaskPlaceholder ? STORED_SECRET_MASK : secretText;
  const showCopy = hasStoredSecret;
  const actionPadding = showCopy ? 'pr-20' : 'pr-10';
  const fieldCopiedClass = copied ? CREDENTIAL_VAULT_COPY_FEEDBACK_CLASS : null;

  const revealSecret = useCallback(() => {
    if (awaitingReveal && onReveal) {
      onReveal();
    }
    setShowPlain(true);
  }, [awaitingReveal, onReveal]);

  const focusWithCursorAtEnd = useCallback(() => {
    guard.onFocus();
    requestAnimationFrame(() => {
      const el = kind === 'textarea' ? textareaRef.current : inputRef.current;
      if (!el) return;
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }, [guard, kind]);

  useEffect(() => {
    if (!pendingEditAfterRevealRef.current || secretText.length === 0) return;
    pendingEditAfterRevealRef.current = false;
    focusWithCursorAtEnd();
  }, [secretText, focusWithCursorAtEnd]);

  const handleFocus = () => {
    if (awaitingReveal) {
      pendingEditAfterRevealRef.current = true;
      revealSecret();
      return;
    }
    if (!showPlain && secretText.length > 0) {
      setShowPlain(true);
      focusWithCursorAtEnd();
      return;
    }
    guard.onFocus();
  };

  const toggleVisibility = () => {
    if (!showPlain) {
      revealSecret();
      return;
    }
    setShowPlain(false);
  };

  const handleCopy = async () => {
    if (!onCopy) return;
    const result = await onCopy();
    if (result !== false) {
      markCopied();
    }
  };

  const handleChange = (next: string) => {
    if (!guard.acceptChange) return;
    if (next === STORED_SECRET_MASK) return;
    onDraftChange(next);
  };

  const applyDiscMask = !showPlain && secretText.length > 0;

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
        onMouseDown={preventControlBlur}
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
          onMouseDown={preventControlBlur}
          onClick={() => void handleCopy()}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
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
            ref={textareaRef}
            id={fieldId}
            name={fieldId}
            value={inputValue}
            readOnly={guard.readOnly || showMaskPlaceholder}
            onFocus={handleFocus}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(
              'min-h-[120px] font-mono text-xs',
              actionPadding,
              applyDiscMask ? CREDENTIAL_VAULT_SECRET_DISC_CLASS : null,
              fieldCopiedClass,
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
          ref={inputRef}
          id={fieldId}
          name={fieldId}
          type="text"
          value={inputValue}
          readOnly={guard.readOnly || showMaskPlaceholder}
          onFocus={handleFocus}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            actionPadding,
            applyDiscMask ? CREDENTIAL_VAULT_SECRET_DISC_CLASS : null,
            fieldCopiedClass,
          )}
          placeholder={hasStoredSecret && isEmpty ? 'Leave empty to keep current' : undefined}
          {...CREDENTIAL_VAULT_INPUT_IGNORE_PROPS}
        />
      </div>
    </div>
  );
}
