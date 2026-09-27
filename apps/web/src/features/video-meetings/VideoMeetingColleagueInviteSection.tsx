'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RelationPickerField } from '@/components/shared';
import { searchEmployeesForPicker } from '@/lib/employees';
import { videoMeetingsApi, type ColleagueInviteListItem } from '@/lib/api/video-meetings';

type VideoMeetingColleagueInviteSectionProps = {
  meetingId: string;
  excludeEmployeeId?: string;
  initialInvites: ColleagueInviteListItem[];
};

export function VideoMeetingColleagueInviteSection({
  meetingId,
  excludeEmployeeId,
  initialInvites,
}: VideoMeetingColleagueInviteSectionProps) {
  const t = useTranslations('videoMeetings');
  const [invites, setInvites] = useState(initialInvites);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const excludeIds = useMemo(() => {
    const ids = new Set(invites.map((row) => row.employeeId));
    if (excludeEmployeeId) ids.add(excludeEmployeeId);
    return ids;
  }, [excludeEmployeeId, invites]);

  const search = useCallback(
    async (query: string) => searchEmployeesForPicker(query, excludeIds),
    [excludeIds],
  );

  const addColleagues = async (ids: string[]) => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const next = await inviteFreshColleagues(meetingId, ids, excludeIds);
      if (next) setInvites(next);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-card/40 border-border/80 space-y-3 rounded-xl border p-4">
      <h2 className="text-sm font-medium">{t('detail.colleagueInvites')}</h2>
      <RelationPickerField
        label={t('detail.colleagueSearch')}
        entityKind="employee"
        multiple
        value={[]}
        selectionLabels={{}}
        disabled={busy}
        onChange={(ids) => void addColleagues(ids)}
        onSearch={search}
        placeholder={t('detail.colleagueSearchPlaceholder')}
      />
      {error ? (
        <p className="text-destructive text-xs">{t('detail.colleagueInviteError')}</p>
      ) : null}
      <ColleagueRoster invites={invites} emptyLabel={t('detail.noColleagueInvites')} />
    </section>
  );
}

async function inviteFreshColleagues(
  meetingId: string,
  ids: string[],
  excludeIds: Set<string>,
): Promise<ColleagueInviteListItem[] | null> {
  const fresh = ids.filter((id) => !excludeIds.has(id));
  if (fresh.length === 0) return null;
  await videoMeetingsApi.inviteColleagues(meetingId, fresh);
  return videoMeetingsApi.listColleagueInvites(meetingId);
}

function ColleagueRoster({
  invites,
  emptyLabel,
}: {
  invites: ColleagueInviteListItem[];
  emptyLabel: string;
}) {
  const t = useTranslations('videoMeetings');
  if (invites.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-1.5 text-sm">
      {invites.map((invite) => (
        <li key={invite.participantId} className="text-muted-foreground flex justify-between gap-2">
          <span className="truncate">{invite.displayName}</span>
          <span className="shrink-0">{t(`detail.colleagueStatus.${invite.admissionStatus}`)}</span>
        </li>
      ))}
    </ul>
  );
}
