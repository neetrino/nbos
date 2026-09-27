'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const TITLE_MAX_LENGTH = 200;

const TITLE_TEXT_CLASS = 'px-1 text-lg leading-snug font-bold tracking-tight sm:text-[1.65rem]';

type VideoMeetingTitleFieldProps = {
  title: string;
  canEdit: boolean;
  busy: boolean;
  onSave: (title: string) => Promise<void>;
};

export function VideoMeetingTitleField({
  title,
  canEdit,
  busy,
  onSave,
}: VideoMeetingTitleFieldProps) {
  const t = useTranslations('videoMeetings');
  const edit = useMeetingTitleDraft(title, onSave);

  if (edit.editing && canEdit) {
    return (
      <TitleEditor
        label={t('titleLabel')}
        value={edit.draft}
        disabled={busy}
        inputRef={edit.inputRef}
        onChange={edit.setDraft}
        onCommit={edit.commit}
        onCancel={edit.cancel}
      />
    );
  }

  return (
    <TitleDisplay
      title={title}
      hint={canEdit ? t('actions.editTitle') : title}
      editable={canEdit && !busy}
      onStart={edit.begin}
    />
  );
}

function useMeetingTitleDraft(title: string, onSave: (nextTitle: string) => Promise<void>) {
  const [draft, setDraft] = useState(title);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === title) {
      setDraft(title);
      return;
    }
    void onSave(next);
  };

  const begin = () => {
    setDraft(title);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(title);
    setEditing(false);
  };

  return { draft, setDraft, editing, inputRef, commit, begin, cancel };
}

function TitleDisplay({
  title,
  hint,
  editable,
  onStart,
}: {
  title: string;
  hint: string;
  editable: boolean;
  onStart: () => void;
}) {
  return (
    <h1
      onClick={() => {
        if (editable) onStart();
      }}
      className={cn(
        TITLE_TEXT_CLASS,
        'text-foreground -mx-1 min-w-0 truncate rounded',
        editable
          ? 'cursor-text transition-colors hover:bg-stone-100 dark:hover:bg-stone-800'
          : 'cursor-default',
      )}
      title={hint}
    >
      {title}
    </h1>
  );
}

type TitleEditorProps = {
  label: string;
  value: string;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

function TitleEditor({
  label,
  value,
  disabled,
  inputRef,
  onChange,
  onCommit,
  onCancel,
}: TitleEditorProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <span className="inline-grid max-w-full align-middle">
      <span
        aria-hidden
        className={cn(TITLE_TEXT_CLASS, 'invisible col-start-1 row-start-1 whitespace-pre')}
      >
        {value || ' '}
      </span>
      <input
        ref={inputRef}
        aria-label={label}
        value={value}
        size={1}
        maxLength={TITLE_MAX_LENGTH}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={onKeyDown}
        className={cn(
          TITLE_TEXT_CLASS,
          'text-foreground border-primary col-start-1 row-start-1 w-full min-w-0 border-0 border-b-2 bg-transparent py-0 outline-none',
        )}
      />
    </span>
  );
}
