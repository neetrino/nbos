'use client';

import type { LucideIcon } from 'lucide-react';
import { AudioLines, PhoneIncoming, PhoneOutgoing, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { cn } from '@/lib/utils';
import type { CallActivity } from '@/lib/api/calls';
import {
  CALL_ACTIVITY_CARD_CLASS,
  CALL_ACTIVITY_ICON_CLASS,
  CALL_ACTIVITY_THUMB_CLASS,
  CALL_ACTIVITY_TONE_DEFAULT_CLASS,
  CALL_ACTIVITY_TONE_MISSED_CLASS,
} from './call-activity-item.constants';
import {
  callActivityPartyName,
  formatCallActivityTime,
  isMissedCall,
} from './call-activity-status';
import { CallActivityRecording } from './CallActivityRecording';
import { canPlayCallRecording } from './call-recording-status';
import { callActivityTitle } from './group-call-activities';

export function CallActivityItem({ call }: { call: CallActivity }) {
  const missed = isMissedCall(call);
  const Icon = call.direction === 'OUTBOUND' ? PhoneOutgoing : PhoneIncoming;

  return (
    <article
      className={CALL_ACTIVITY_CARD_CLASS}
      aria-label={`${callActivityTitle(call.direction)} ${callActivityPartyName(call)}`}
    >
      <CallActivityItemHeader call={call} missed={missed} Icon={Icon} />
      <div className="mt-3 flex items-start gap-3">
        <CallActivityThumb missed={missed} ready={canPlayCallRecording(call.recordingStatus)} />
        <div className="min-w-0 flex-1">
          <CallActivityParty call={call} />
          <CallActivityRecording call={call} />
        </div>
      </div>
    </article>
  );
}

function CallActivityItemHeader(props: { call: CallActivity; missed: boolean; Icon: LucideIcon }) {
  const { call, missed, Icon } = props;
  return (
    <header className="flex items-center gap-2.5">
      <span
        className={cn(
          CALL_ACTIVITY_ICON_CLASS,
          missed ? CALL_ACTIVITY_TONE_MISSED_CLASS : CALL_ACTIVITY_TONE_DEFAULT_CLASS,
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h4 className="text-foreground truncate text-sm font-semibold">
          {callActivityTitle(call.direction)}
        </h4>
        {missed ? (
          <Badge variant="destructive" className="shrink-0">
            Missed
          </Badge>
        ) : null}
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {formatCallActivityTime(call.createdAt)}
        </span>
      </div>
      {call.employeeName ? (
        <span title={call.employeeName}>
          <EmployeePersonAvatar label={call.employeeName} className="size-7 text-[10px]" />
        </span>
      ) : null}
    </header>
  );
}

function CallActivityThumb(props: { missed: boolean; ready: boolean }) {
  const Icon = props.missed ? PhoneIncoming : props.ready ? Play : AudioLines;
  return (
    <span
      className={cn(
        CALL_ACTIVITY_THUMB_CLASS,
        props.missed ? CALL_ACTIVITY_TONE_MISSED_CLASS : CALL_ACTIVITY_TONE_DEFAULT_CLASS,
      )}
      aria-hidden
    >
      <Icon className="size-5" />
    </span>
  );
}

function CallActivityParty({ call }: { call: CallActivity }) {
  return (
    <p className="min-w-0 text-sm leading-snug">
      <span className="text-muted-foreground">Client </span>
      <span className="text-primary font-medium">{callActivityPartyName(call)}</span>
      {call.phone ? <span className="text-primary"> {call.phone}</span> : null}
    </p>
  );
}
