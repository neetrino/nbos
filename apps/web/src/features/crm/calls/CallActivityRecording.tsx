'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CallActivity } from '@/lib/api/calls';
import { CallRecordingPlayer } from './CallRecordingPlayer';
import { CALL_RECORDING_PLAYER_CLASS } from './call-recording-player.constants';
import { callRecordingLabelKey, canPlayCallRecording } from './call-recording-status';

export function CallActivityRecording({
  call,
  compact = false,
}: {
  call: CallActivity;
  compact?: boolean;
}) {
  const t = useTranslations('crm');
  if (canPlayCallRecording(call.recordingStatus)) {
    return (
      <div className={compact ? 'min-w-0 flex-1' : 'mt-2'}>
        <CallRecordingPlayer callId={call.id} durationSec={call.durationSec} compact={compact} />
      </div>
    );
  }

  const label = t(callRecordingLabelKey(call.recordingStatus) as never);
  if (compact) {
    return <p className="text-muted-foreground shrink-0 text-xs">{label}</p>;
  }

  return (
    <div className={cn(CALL_RECORDING_PLAYER_CLASS, 'mt-2')}>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
