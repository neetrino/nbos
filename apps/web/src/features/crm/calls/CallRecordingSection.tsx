import type { CallActivity } from '@/lib/api/calls';
import { CallRecordingPlayer } from './CallRecordingPlayer';
import { CallDetailField } from './CallDetailField';
import { callRecordingLabel, canPlayCallRecording } from './call-recording-status';

export function CallRecordingSection({ call }: { call: CallActivity }) {
  if (!canPlayCallRecording(call.recordingStatus)) {
    return <CallDetailField label="Recording" value={callRecordingLabel(call.recordingStatus)} />;
  }

  return (
    <>
      <dt className="text-muted-foreground">Recording</dt>
      <dd>
        <CallRecordingPlayer callId={call.id} />
      </dd>
    </>
  );
}
