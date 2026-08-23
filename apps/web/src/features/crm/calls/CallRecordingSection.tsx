import { callRecordingSrc, type CallActivity } from '@/lib/api/calls';
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
        <audio className="w-full" controls preload="metadata" src={callRecordingSrc(call.id)}>
          Play
        </audio>
      </dd>
    </>
  );
}
