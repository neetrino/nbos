'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TITLE_MAX_LENGTH = 200;

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
  const [draft, setDraft] = useState(title);
  const [editing, setEditing] = useState(false);

  const save = async () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === title) {
      setDraft(title);
      return;
    }
    await onSave(next);
  };

  const startEdit = () => {
    setDraft(title);
    setEditing(true);
  };

  if (!canEdit || !editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {canEdit ? (
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={startEdit}>
            {t('actions.editTitle')}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <TitleEditor
      label={t('titleLabel')}
      value={draft}
      disabled={busy}
      onChange={setDraft}
      onCommit={() => void save()}
      onCancel={() => {
        setDraft(title);
        setEditing(false);
      }}
    />
  );
}

function TitleEditor({
  label,
  value,
  disabled,
  onChange,
  onCommit,
  onCancel,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <Input
      aria-label={label}
      value={value}
      maxLength={TITLE_MAX_LENGTH}
      disabled={disabled}
      autoFocus
      onChange={(event) => onChange(event.target.value)}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') onCancel();
      }}
    />
  );
}
