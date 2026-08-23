'use client';

import { PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import type { CallActivity } from '@/lib/api/calls';
import { formatCallDuration } from './format-call-duration';
import { callActivityTitle } from './group-call-activities';

export function CallActivityItem(props: {
  call: CallActivity;
  onOpen: (call: CallActivity) => void;
}) {
  const { call, onOpen } = props;
  const Icon = call.direction === 'OUTBOUND' ? PhoneOutgoing : PhoneIncoming;

  return (
    <button
      type="button"
      onClick={() => onOpen(call)}
      className="border-border bg-card hover:bg-muted/40 flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors"
    >
      <span className="bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-primary size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-sm font-semibold">
          {callActivityTitle(call.direction)}
        </span>
        <CallActivityItemMeta call={call} />
      </span>
      <span className="text-muted-foreground shrink-0 text-xs font-medium">
        {formatCallDuration(call.durationSec)}
      </span>
    </button>
  );
}

function CallActivityItemMeta({ call }: { call: CallActivity }) {
  const lines = [
    call.phone ? `Phone: ${call.phone}` : null,
    call.contactName ? `Contact: ${call.contactName}` : call.phone ? 'Contact: New caller' : null,
    call.leadName ? `Lead: ${call.leadName}` : null,
    call.employeeName ? `Employee: ${call.employeeName}` : null,
  ].filter((line): line is string => line != null);

  return (
    <span className="text-muted-foreground mt-1 block space-y-0.5 text-xs leading-relaxed">
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </span>
  );
}
