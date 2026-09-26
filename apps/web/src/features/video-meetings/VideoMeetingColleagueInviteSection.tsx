'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionLabels, setSelectionLabels] = useState<Record<string, string>>({});
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

  const sendInvites = async () => {
    if (selectedIds.length === 0 || busy) return;
    setBusy(true);
    setError(false);
    try {
      await videoMeetingsApi.inviteColleagues(meetingId, selectedIds);
      setInvites(await videoMeetingsApi.listColleagueInvites(meetingId));
      setSelectedIds([]);
      setSelectionLabels({});
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-card/40 border-border/80 space-y-3 rounded-xl border p-4">
      <div>
        <h2 className="text-sm font-medium">{t('detail.colleagueInvites')}</h2>
        <p className="text-muted-foreground mt-1 text-xs">{t('detail.colleagueInvitesHint')}</p>
      </div>
      <RelationPickerField
        label={t('detail.colleagueSearch')}
        entityKind="employee"
        multiple
        value={selectedIds}
        selectionLabels={selectionLabels}
        onChange={(ids, labels) => {
          setSelectedIds(ids);
          setSelectionLabels(labels);
        }}
        onSearch={search}
        placeholder={t('detail.colleagueSearchPlaceholder')}
      />
      <Button
        type="button"
        size="sm"
        disabled={busy || selectedIds.length === 0}
        onClick={() => void sendInvites()}
      >
        {t('actions.inviteColleagues')}
      </Button>
      {error ? (
        <p className="text-destructive text-xs">{t('detail.colleagueInviteError')}</p>
      ) : null}
      {invites.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('detail.noColleagueInvites')}</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {invites.map((invite) => (
            <li
              key={invite.participantId}
              className="text-muted-foreground flex justify-between gap-2"
            >
              <span className="truncate">{invite.displayName}</span>
              <span className="shrink-0">
                {t(`detail.colleagueStatus.${invite.admissionStatus}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
