'use client';

import { useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { callsApi, type ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CallRecordingPlayer } from './CallRecordingPlayer';
import { CallDetailField } from './CallDetailField';
import { callRecordingLabelKey, canPlayCallRecording } from './call-recording-status';
import { ACTIVE_CALL_CONTEXT_CARD_CLASS, CALL_NOTE_MAX_LENGTH } from './active-call.constants';
import { ActiveCallSectionHeading } from './ActiveCallSectionHeading';
import {
  CALL_NOTE_CONFLICT_MESSAGE_KEY,
  canSaveCallNote,
  isCallNoteConflictError,
} from './call-note-editor';
import { formatCallDuration } from './format-call-duration';

export function ActiveCallEndedSection(props: {
  snapshot: ActiveCallScreenSnapshot;
  onSnapshot: (next: ActiveCallScreenSnapshot) => void;
}) {
  const t = useTranslations('crm');
  const { snapshot, onSnapshot } = props;
  return (
    <section className={cn(ACTIVE_CALL_CONTEXT_CARD_CLASS, 'mt-3')}>
      <ActiveCallSectionHeading title={t('calls.afterCall')} icon={NotebookPen} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <CallDetailField
          label={t('calls.duration')}
          value={formatCallDuration(snapshot.durationSec)}
        />
        <CallDetailField label={t('calls.disposition')} value={snapshot.disposition} />
        <RecordingRow snapshot={snapshot} />
      </dl>
      <NoteEditor key={snapshot.callId} snapshot={snapshot} onSnapshot={onSnapshot} />
    </section>
  );
}

function RecordingRow({ snapshot }: { snapshot: ActiveCallScreenSnapshot }) {
  const t = useTranslations('crm');
  if (!canPlayCallRecording(snapshot.recordingStatus)) {
    return (
      <CallDetailField
        label={t('calls.recording')}
        value={t(callRecordingLabelKey(snapshot.recordingStatus) as never)}
      />
    );
  }
  return (
    <>
      <dt className="text-muted-foreground">{t('calls.recording')}</dt>
      <dd>
        <CallRecordingPlayer
          callId={snapshot.callId}
          durationSec={snapshot.durationSec}
          preload="metadata"
        />
      </dd>
    </>
  );
}

function NoteEditor(props: {
  snapshot: ActiveCallScreenSnapshot;
  onSnapshot: (next: ActiveCallScreenSnapshot) => void;
}) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');
  const { snapshot, onSnapshot } = props;
  const { can } = usePermission();
  const [note, setNote] = useState(snapshot.note ?? '');
  const [saving, setSaving] = useState(false);
  const hasCrmEdit = can('EDIT', 'CRM_LEADS') || can('EDIT', 'CRM_DEALS');
  const canSave = canSaveCallNote(snapshot.phase, hasCrmEdit);

  return (
    <div className="mt-4 space-y-2">
      <label className="text-muted-foreground text-sm" htmlFor="active-call-note">
        {t('calls.note')}
      </label>
      <Textarea
        id="active-call-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={CALL_NOTE_MAX_LENGTH}
        disabled={!canSave || saving}
      />
      {canSave ? (
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() => {
            void saveNote({ snapshot, note, onSnapshot, setSaving, t, tCommon });
          }}
        >
          {tCommon('save')}
        </Button>
      ) : null}
    </div>
  );
}

async function saveNote(params: {
  snapshot: ActiveCallScreenSnapshot;
  note: string;
  onSnapshot: (next: ActiveCallScreenSnapshot) => void;
  setSaving: (value: boolean) => void;
  t: ReturnType<typeof useTranslations<'crm'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
}): Promise<void> {
  const { snapshot, note, onSnapshot, setSaving, t } = params;
  setSaving(true);
  try {
    const next = await callsApi.updateNote(snapshot.callId, {
      note: note.trim() || null,
      expectedNoteVersion: snapshot.noteVersion,
    });
    onSnapshot(next);
  } catch (caught: unknown) {
    await handleNoteSaveError(caught, snapshot.callId, onSnapshot, t);
  } finally {
    setSaving(false);
  }
}

async function handleNoteSaveError(
  caught: unknown,
  callId: string,
  onSnapshot: (next: ActiveCallScreenSnapshot) => void,
  t: ReturnType<typeof useTranslations<'crm'>>,
): Promise<void> {
  if (!isCallNoteConflictError(caught)) {
    toast.error(getApiErrorMessage(caught, t('calls.saveNoteFailed')));
    return;
  }
  toast.error(t(CALL_NOTE_CONFLICT_MESSAGE_KEY as never));
  try {
    onSnapshot(await callsApi.getScreen(callId));
  } catch {
    toast.error(t('calls.reloadConflict'));
  }
}
