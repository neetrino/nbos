import { cn } from '@/lib/utils';
import type { CallActivity } from '@/lib/api/calls';
import { CallRecordingPlayer } from './CallRecordingPlayer';
import { CALL_RECORDING_PLAYER_CLASS } from './call-recording-player.constants';
import { callRecordingLabel, canPlayCallRecording } from './call-recording-status';

export function CallActivityRecording({ call }: { call: CallActivity }) {
  if (canPlayCallRecording(call.recordingStatus)) {
    return (
      <div className="mt-2">
        <CallRecordingPlayer callId={call.id} durationSec={call.durationSec} />
      </div>
    );
  }

  return (
    <div className={cn(CALL_RECORDING_PLAYER_CLASS, 'mt-2')}>
      <p className="text-muted-foreground text-xs">{callRecordingLabel(call.recordingStatus)}</p>
    </div>
  );
}
