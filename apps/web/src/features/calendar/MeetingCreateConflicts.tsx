'use client';

import { useTranslations } from 'next-intl';
import type { CalendarMeetingConflictPayload } from '@/lib/api/calendar';
import { InlineField } from '@/components/shared';

export interface MeetingCreateConflictsProps {
  conflicts: CalendarMeetingConflictPayload[];
  overrideReason: string;
  onOverrideReasonChange: (value: string) => void;
}

export function MeetingCreateConflicts({
  conflicts,
  overrideReason,
  onOverrideReasonChange,
}: MeetingCreateConflictsProps) {
  const t = useTranslations('forms');

  return (
    <div className="bg-secondary/60 space-y-2 rounded-xl border p-3 text-sm">
      <p className="text-foreground font-medium">{t('meeting.conflicts.title')}</p>
      <ul className="text-muted-foreground list-inside list-disc space-y-1">
        {conflicts.map((c) => (
          <li key={`${c.code}-${c.meetingId}`}>
            <span className="text-foreground">{c.meetingTitle}</span>
          </li>
        ))}
      </ul>
      <InlineField
        variant="controlled"
        label={t('meeting.conflicts.overrideReason')}
        type="textarea"
        value={overrideReason}
        placeholder={t('meeting.conflicts.overridePlaceholder')}
        onValueChange={onOverrideReasonChange}
      />
    </div>
  );
}
