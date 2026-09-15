'use client';

import { useTranslations } from 'next-intl';
import type { CalendarMeetingConflictPayload } from '@/lib/api/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
      <div>
        <Label htmlFor="cal-meet-override">{t('meeting.conflicts.overrideReason')}</Label>
        <Textarea
          id="cal-meet-override"
          className="mt-1.5"
          rows={2}
          value={overrideReason}
          onChange={(e) => onOverrideReasonChange(e.target.value)}
          placeholder={t('meeting.conflicts.overridePlaceholder')}
        />
      </div>
    </div>
  );
}
