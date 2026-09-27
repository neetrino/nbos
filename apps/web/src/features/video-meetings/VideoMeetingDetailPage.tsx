'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent, ErrorState, LoadingState } from '@/components/shared';
import { TEAM_SHEET_BODY_CLASS } from '@/features/hr/constants/team-sheet-layout';
import { usePermission } from '@/lib/permissions';
import {
  videoMeetingsApi,
  type ColleagueInviteListItem,
  type VideoMeetingCard,
} from '@/lib/api/video-meetings';
import { VideoMeetingColleagueInviteSection } from './VideoMeetingColleagueInviteSection';
import { VideoMeetingDetailActions } from './VideoMeetingDetailActions';
import { VideoMeetingGuestLinkButton } from './VideoMeetingGuestLinkButton';
import { VideoMeetingEntityLinksSection } from './video-meeting-detail-sections';
import { resolveVideoMeetingDisplayTitle } from './video-meeting-title';
import { VideoMeetingTitleField } from './VideoMeetingTitleField';
import { videoMeetingStatusLabel } from './video-meeting-status-label';

type VideoMeetingDetailPageProps = {
  meetingId: string;
};

export function VideoMeetingDetailPage({ meetingId }: VideoMeetingDetailPageProps) {
  const t = useTranslations('videoMeetings');
  const router = useRouter();
  const { me, can } = usePermission();
  const [card, setCard] = useState<VideoMeetingCard | null>(null);
  const [colleagues, setColleagues] = useState<ColleagueInviteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const canEdit = can('EDIT', 'VIDEO_MEETINGS');
  const isHost = useMemo(
    () => Boolean(me && card && (me.id === card.hostEmployeeId || me.id === card.ownerEmployeeId)),
    [me, card],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const nextCard = await videoMeetingsApi.getCard(meetingId);
      setCard(nextCard);
      if (canEdit) {
        setColleagues(
          await videoMeetingsApi
            .listColleagueInvites(meetingId)
            .catch(() => [] as ColleagueInviteListItem[]),
        );
      } else {
        setColleagues([]);
      }
    } catch {
      setError(true);
      setCard(null);
    } finally {
      setLoading(false);
    }
  }, [canEdit, meetingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (action: () => Promise<VideoMeetingCard>) => {
    setBusy(true);
    try {
      setCard(await action());
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (loading || error || !card) {
    return (
      <VideoMeetingDetailShell meetingId={meetingId} onClose={() => router.push('/video-meetings')}>
        {loading ? (
          <LoadingState />
        ) : (
          <ErrorState description={t('loadError')} onRetry={() => void load()} />
        )}
      </VideoMeetingDetailShell>
    );
  }

  const title = resolveVideoMeetingDisplayTitle(card.title, t('defaultTitle'));
  const hostLabel =
    me?.id === card.hostEmployeeId ? t('detail.youAreHost') : card.hostEmployeeId.slice(0, 8);

  return (
    <VideoMeetingDetailShell meetingId={meetingId} onClose={() => router.push('/video-meetings')}>
      <div className={TEAM_SHEET_BODY_CLASS}>
        <header className="space-y-3">
          <VideoMeetingTitleField
            title={title}
            canEdit={canEdit && isHost}
            busy={busy}
            onSave={async (nextTitle) => {
              setCard(await videoMeetingsApi.rename(meetingId, nextTitle));
            }}
          />
          <p className="text-muted-foreground text-sm">
            {videoMeetingStatusLabel(card.status, t)} · {t('detail.host')}: {hostLabel}
          </p>
          <p className="text-muted-foreground text-xs">
            {card.scheduledStartsAt
              ? format(new Date(card.scheduledStartsAt), 'PPp')
              : t('detail.notScheduled')}
          </p>
          <VideoMeetingDetailActions
            meetingId={meetingId}
            status={card.status}
            canManage={canEdit && isHost}
            busy={busy}
            onStart={() =>
              void runAction(async () => {
                const started = await videoMeetingsApi.start(meetingId);
                router.push(`/video-meetings/${meetingId}/room`);
                return started;
              })
            }
            onEnd={() => void runAction(() => videoMeetingsApi.end(meetingId))}
            onCancel={() => void runAction(() => videoMeetingsApi.cancel(meetingId))}
          />
        </header>

        {canEdit && isHost ? (
          <div className="flex flex-col gap-4">
            <VideoMeetingColleagueInviteSection
              meetingId={meetingId}
              excludeEmployeeId={me?.id}
              initialInvites={colleagues}
            />
            <VideoMeetingGuestLinkButton meetingId={meetingId} />
          </div>
        ) : null}

        {canEdit && isHost ? (
          <VideoMeetingEntityLinksSection
            card={card}
            onAttach={async (entityType, entityId) => {
              setCard(await videoMeetingsApi.attachEntityLink(meetingId, entityType, entityId));
            }}
            onDetach={async (linkId) => {
              setCard(await videoMeetingsApi.detachEntityLink(meetingId, linkId));
            }}
            t={t}
          />
        ) : null}
      </div>
    </VideoMeetingDetailShell>
  );
}

function VideoMeetingDetailShell({
  meetingId,
  onClose,
  children,
}: {
  meetingId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <EntityDetailSheetContent
        open
        layout="auxiliary"
        showRailActions={false}
        sourcePageHref={`/video-meetings/${meetingId}`}
      >
        {children}
      </EntityDetailSheetContent>
    </Sheet>
  );
}
