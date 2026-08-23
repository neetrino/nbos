import type { CallActivity } from '@/lib/api/calls';
import { formatCallDuration } from './format-call-duration';
import { CallDetailField } from './CallDetailField';
import { CallRecordingSection } from './CallRecordingSection';
import { callActivityTitle } from './group-call-activities';

export function CallActivityDetails({ call }: { call: CallActivity }) {
  const occurredAt = new Date(call.createdAt).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <CallDetailField label="Direction" value={callActivityTitle(call.direction)} />
      <CallDetailField label="Phone" value={call.phone} />
      <CallDetailField label="Date/time" value={occurredAt} />
      <CallDetailField label="Duration" value={formatCallDuration(call.durationSec)} />
      <CallDetailField label="Status" value={formatCallStatus(call.status)} />
      <CallDetailField label="Disposition" value={call.disposition} />
      <CallDetailField label="Employee" value={call.employeeName} />
      <CallDetailField label="Contact" value={call.contactName} empty="New caller" />
      <CallDetailField label="Lead" value={call.leadName} />
      <CallDetailField label="Deal" value={call.dealName} empty="No open deal" />
      <CallRecordingSection call={call} />
    </dl>
  );
}

function formatCallStatus(status: string | null): string | null {
  if (!status) return null;
  return status.charAt(0).toUpperCase() + status.slice(1);
}
