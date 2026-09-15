'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTypedPlaceholder } from '@/features/credentials/hooks/use-typed-placeholder';

const SHEET_TITLE_CLASS = 'text-xl font-semibold leading-tight tracking-tight';
const SHEET_TITLE_FIELD_CLASS = cn(SHEET_TITLE_CLASS, 'min-h-7 max-w-full truncate');
const SHEET_TITLE_INPUT_CLASS = cn(
  SHEET_TITLE_CLASS,
  'min-w-[12ch] max-w-full flex-1 border-0 border-b-2 bg-transparent p-0 outline-none',
);
const NAME_EXAMPLES = ['Beget — Production', 'OpenAI — Client'] as const;

export interface CredentialFormSheetNameFieldProps {
  isCreate: boolean;
  name: string;
  onNameChange: (value: string) => void;
  resetKey: string;
}

function useCredentialNameDraft(
  isCreate: boolean,
  name: string,
  onNameChange: (value: string) => void,
  resetKey: string,
) {
  const [editingName, setEditingName] = useState(isCreate);
  const [nameDraft, setNameDraft] = useState(name);
  const [hasTyped, setHasTyped] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [trackedResetKey, setTrackedResetKey] = useState(resetKey);

  if (trackedResetKey !== resetKey) {
    setTrackedResetKey(resetKey);
    setEditingName(isCreate);
    setNameDraft(name);
    setHasTyped(false);
  }

  if (!hasTyped && name !== nameDraft) {
    setNameDraft(name);
  }

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  return {
    editingName,
    nameDraft,
    hasTyped,
    emptyCreate: isCreate && !name.trim() && !nameDraft.trim(),
    nameInputRef,
    commitName: (raw: string) => {
      const trimmed = raw.trim();
      onNameChange(trimmed);
      setNameDraft(trimmed);
      setEditingName(isCreate || trimmed.length === 0);
    },
    changeDraft: (next: string) => {
      setHasTyped(true);
      setNameDraft(next);
      onNameChange(next);
    },
    cancelDraft: () => {
      setHasTyped(false);
      setNameDraft(name);
      onNameChange(name);
      setEditingName(isCreate);
    },
    startEditing: () => {
      setNameDraft(name);
      setEditingName(true);
    },
  };
}

export function CredentialFormSheetNameField({
  isCreate,
  name,
  onNameChange,
  resetKey,
}: CredentialFormSheetNameFieldProps) {
  const t = useTranslations('credentials');
  const draft = useCredentialNameDraft(isCreate, name, onNameChange, resetKey);
  const typedPlaceholder = useTypedPlaceholder(NAME_EXAMPLES, draft.emptyCreate && !draft.hasTyped);
  const placeholder = draft.emptyCreate
    ? draft.hasTyped
      ? t('form.nameRequired')
      : typedPlaceholder || t('form.nameRequired')
    : t('form.credentialName');

  if (draft.editingName) {
    return (
      <CredentialNameEditingInput
        inputRef={draft.nameInputRef}
        nameDraft={draft.nameDraft}
        emptyCreate={draft.emptyCreate}
        placeholder={placeholder}
        ariaLabel={t('form.credentialName')}
        isCreate={isCreate}
        onChange={draft.changeDraft}
        onCommit={() => draft.commitName(draft.nameDraft)}
        onCancel={draft.cancelDraft}
      />
    );
  }

  return (
    <button
      type="button"
      className={cn(
        SHEET_TITLE_FIELD_CLASS,
        'text-left outline-none',
        name.trim() ? 'text-foreground' : 'text-muted-foreground',
      )}
      onClick={draft.startEditing}
    >
      {name.trim() || t('form.credentialName')}
    </button>
  );
}

function CredentialNameEditingInput({
  inputRef,
  nameDraft,
  emptyCreate,
  placeholder,
  ariaLabel,
  isCreate,
  onChange,
  onCommit,
  onCancel,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  nameDraft: string;
  emptyCreate: boolean;
  placeholder: string;
  ariaLabel: string;
  isCreate: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onCommit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <input
      ref={inputRef}
      data-credential-name-field
      value={nameDraft}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={onKeyDown}
      className={cn(
        SHEET_TITLE_INPUT_CLASS,
        emptyCreate
          ? 'border-destructive placeholder:text-destructive text-destructive'
          : 'border-primary text-foreground placeholder:text-muted-foreground/70',
      )}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={emptyCreate || undefined}
      aria-required={isCreate || undefined}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      data-1p-ignore
      data-lpignore="true"
    />
  );
}
