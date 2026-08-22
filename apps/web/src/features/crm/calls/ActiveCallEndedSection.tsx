'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { callRecordingSrc, callsApi, type ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { toast } from 'sonner';
import { CallDetailField } from './CallDetailField';
import { callRecordingLabel, canPlayCallRecording } from './call-recording-status';
import { CALL_NOTE_MAX_LENGTH } from './active-call.constants';
import {
  CALL_NOTE_CONFLICT_MESSAGE,
  canSaveCallNote,
  isCallNoteConflictError,
} from './call-note-editor';
import { formatCallDuration } from './format-call-duration';

export function ActiveCallEndedSection(props: {
  snapshot: ActiveCallScreenSnapshot;
  onSnapshot: (next: ActiveCallScreenSnapshot) => void;
}) {
  const { snapshot, onSnapshot } = props;
  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="text-foreground mb-3 text-sm font-semibold">After the call</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <CallDetailField label="Duration" value={formatCallDuration(snapshot.durationSec)} />
        <CallDetailField label="Disposition" value={snapshot.disposition} />
        <RecordingRow snapshot={snapshot} />
      </dl>
      <NoteEditor key={snapshot.callId} snapshot={snapshot} onSnapshot={onSnapshot} />
    </section>
  );
}

function RecordingRow({ snapshot }: { snapshot: ActiveCallScreenSnapshot }) {
  if (!canPlayCallRecording(snapshot.recordingStatus)) {
    return (
      <CallDetailField label="Recording" value={callRecordingLabel(snapshot.recordingStatus)} />
    );
  }
  return (
    <>
      <dt className="text-muted-foreground">Recording</dt>
      <dd>
        <audio
          className="w-full"
          controls
          preload="metadata"
          src={callRecordingSrc(snapshot.callId)}
        >
          Play
        </audio>
      </dd>
    </>
  );
}

function NoteEditor(props: {
  snapshot: ActiveCallScreenSnapshot;
  onSnapshot: (next: ActiveCallScreenSnapshot) => void;
}) {
  const { snapshot, onSnapshot } = props;
  const { can } = usePermission();
  const [note, setNote] = useState(snapshot.note ?? '');
  const [saving, setSaving] = useState(false);
  const hasCrmEdit = can('EDIT', 'CRM_LEADS') || can('EDIT', 'CRM_DEALS');
  const canSave = canSaveCallNote(snapshot.phase, hasCrmEdit);

  return (
    <div className="mt-4 space-y-2">
      <label className="text-muted-foreground text-sm" htmlFor="active-call-note">
        Note
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
            void saveNote({ snapshot, note, onSnapshot, setSaving });
          }}
        >
          Save note
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
}): Promise<void> {
  const { snapshot, note, onSnapshot, setSaving } = params;
  setSaving(true);
  try {
    const next = await callsApi.updateNote(snapshot.callId, {
      note: note.trim() || null,
      expectedNoteVersion: snapshot.noteVersion,
    });
    onSnapshot(next);
  } catch (caught: unknown) {
    await handleNoteSaveError(caught, snapshot.callId, onSnapshot);
  } finally {
    setSaving(false);
  }
}

async function handleNoteSaveError(
  caught: unknown,
  callId: string,
  onSnapshot: (next: ActiveCallScreenSnapshot) => void,
): Promise<void> {
  if (!isCallNoteConflictError(caught)) {
    toast.error(getApiErrorMessage(caught, 'Could not save note'));
    return;
  }
  toast.error(CALL_NOTE_CONFLICT_MESSAGE);
  try {
    onSnapshot(await callsApi.getScreen(callId));
  } catch {
    toast.error('Could not reload the call after a note conflict');
  }
}
