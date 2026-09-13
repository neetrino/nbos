'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, Copy, Eye, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CredentialFormFieldLabel } from '@/features/credentials/components/credential-form-field-label';
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

const PEEK_HINT_EYE_SIZE = 14;

function SecretFieldPeekHint({
  visible,
  spacer,
  discMask,
  kind,
  insetEnd,
}: {
  visible: boolean;
  spacer: string;
  discMask: boolean;
  kind: 'password' | 'textarea';
  insetEnd: boolean;
}) {
  if (!visible) return null;
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-3 z-[1] flex items-center overflow-hidden',
        insetEnd ? 'right-10' : 'right-3',
        kind === 'textarea' ? 'top-2.5' : 'top-1/2 -translate-y-1/2',
      )}
    >
      <span
        className={cn(
          'invisible whitespace-pre',
          kind === 'textarea' ? 'font-mono text-xs' : 'text-base md:text-sm',
          discMask ? CREDENTIAL_VAULT_SECRET_DISC_CLASS : null,
        )}
      >
        {spacer}
      </span>
      <Eye size={PEEK_HINT_EYE_SIZE} className="text-muted-foreground ml-1 shrink-0" />
    </span>
  );
}

/** Keeps focus on the control when using adjacent icon buttons (avoids autofill flashes). */
function preventControlBlur(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export interface CredentialVaultSecretFieldProps {
  guardKey: string;
  fieldId: string;
  label: string;
  icon?: LucideIcon;
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
  icon: Icon = Lock,
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
  const [trackedGuardKey, setTrackedGuardKey] = useState(guardKey);

  const secretText = draft.length > 0 ? draft : (revealedValue ?? '');
  const hasStoredSecret = isExisting && hasStored;
  const awaitingReveal = hasStoredSecret && secretText.length === 0;
  const showMaskPlaceholder = awaitingReveal;
  const isEmpty = !hasStoredSecret && secretText.length === 0;

  if (trackedGuardKey !== guardKey) {
    setTrackedGuardKey(guardKey);
    setShowPlain(false);
  }

  const inputValue = showMaskPlaceholder ? STORED_SECRET_MASK : secretText;
  const showCopy = hasStoredSecret;
  const showPeekHint = !showPlain && (hasStoredSecret || secretText.length > 0);
  const actionPadding = showCopy || showPeekHint ? 'pr-10' : null;
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
    pendingEditAfterRevealRef.current = false;
  }, [guardKey]);

  useEffect(() => {
    if (!pendingEditAfterRevealRef.current || secretText.length === 0) return;
    pendingEditAfterRevealRef.current = false;
    queueMicrotask(() => focusWithCursorAtEnd());
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

  const peekHint = (
    <SecretFieldPeekHint
      visible={showPeekHint}
      spacer={inputValue}
      discMask={applyDiscMask}
      kind={kind}
      insetEnd={showCopy}
    />
  );

  const actionButtons = showCopy ? (
    <div
      className={cn(
        'absolute z-10 flex items-center',
        kind === 'textarea' ? 'top-2 right-2' : 'top-1/2 right-1 -translate-y-1/2',
      )}
    >
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
    </div>
  ) : null;

  if (kind === 'textarea') {
    return (
      <div className="grid gap-2">
        <CredentialFormFieldLabel htmlFor={fieldId} label={label} icon={Icon} />
        <div className="relative">
          {peekHint}
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
              showPeekHint ? 'cursor-pointer' : null,
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
      <CredentialFormFieldLabel htmlFor={fieldId} label={label} icon={Icon} />
      <div className="relative">
        {peekHint}
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
            showPeekHint ? 'cursor-pointer' : null,
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
