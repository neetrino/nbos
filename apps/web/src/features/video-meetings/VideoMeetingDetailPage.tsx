'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/shared';
import { usePermission } from '@/lib/permissions';
import {
  videoMeetingsApi,
  type ColleagueInviteListItem,
  type InviteListItem,
  type VideoMeetingCard,
  type VideoMeetingEntityLinkType,
} from '@/lib/api/video-meetings';
import { VIDEO_MEETING_INVITE_DEFAULT_TTL_HOURS } from './constants';
import { VideoMeetingColleagueInviteSection } from './VideoMeetingColleagueInviteSection';
import { VideoMeetingRecordingIndicator } from './VideoMeetingRecordingIndicator';
import { VideoMeetingRecordingPlayback } from './VideoMeetingRecordingPlayback';
import {
  VideoMeetingEntityLinksSection,
  VideoMeetingInviteSection,
} from './video-meeting-detail-sections';
import { buildGuestInviteJoinUrl, resolveVideoMeetingDisplayTitle } from './video-meeting-title';
import { videoMeetingStatusLabel } from './video-meeting-status-label';

type VideoMeetingDetailPageProps = {
  meetingId: string;
};

function inviteExpiryIso(): string {
  const date = new Date();
  date.setHours(date.getHours() + VIDEO_MEETING_INVITE_DEFAULT_TTL_HOURS);
  return date.toISOString();
}

export function VideoMeetingDetailPage({ meetingId }: VideoMeetingDetailPageProps) {
  const t = useTranslations('videoMeetings');
  const { me, can } = usePermission();
  const [card, setCard] = useState<VideoMeetingCard | null>(null);
  const [invites, setInvites] = useState<InviteListItem[]>([]);
  const [colleagues, setColleagues] = useState<ColleagueInviteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [freshJoinUrl, setFreshJoinUrl] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<VideoMeetingEntityLinkType>('DEAL');
  const [entityId, setEntityId] = useState('');
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
        const [nextInvites, nextColleagues] = await Promise.all([
          videoMeetingsApi.listInvites(meetingId),
          videoMeetingsApi
            .listColleagueInvites(meetingId)
            .catch(() => [] as ColleagueInviteListItem[]),
        ]);
        setInvites(nextInvites);
        setColleagues(nextColleagues);
      } else {
        setInvites([]);
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

  if (loading) return <LoadingState />;
  if (error || !card) {
    return <ErrorState description={t('loadError')} onRetry={() => void load()} />;
  }

  const title = resolveVideoMeetingDisplayTitle(card.title, t('defaultTitle'));
  const hostLabel =
    me?.id === card.hostEmployeeId ? t('detail.youAreHost') : card.hostEmployeeId.slice(0, 8);
  const isLive = card.status === 'ACTIVE';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">
              {videoMeetingStatusLabel(card.status, t)} · {t('detail.host')}: {hostLabel}
            </p>
            <p className="text-muted-foreground text-xs">
              {card.scheduledStartsAt
                ? format(new Date(card.scheduledStartsAt), 'PPp')
                : t('detail.notScheduled')}
            </p>
          </div>
          <Link
            href="/video-meetings"
            className="border-border hover:bg-muted/90 inline-flex h-9 items-center rounded-lg border px-3 text-sm"
          >
            {t('actions.backToList')}
          </Link>
        </div>
        {isLive ? (
          <Link
            href={`/video-meetings/${meetingId}/room`}
            className="bg-primary text-primary-foreground inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium sm:w-auto sm:px-6"
          >
            {t('actions.joinRoom')}
          </Link>
        ) : null}
        {canEdit && isHost ? (
          <div className="flex flex-wrap gap-2">
            {card.status !== 'ACTIVE' && card.status !== 'ENDED' && card.status !== 'CANCELLED' ? (
              <Button
                type="button"
                disabled={busy}
                onClick={() => void runAction(() => videoMeetingsApi.start(meetingId))}
              >
                {t('actions.startMeeting')}
              </Button>
            ) : null}
            {card.status === 'ACTIVE' ? (
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => void runAction(() => videoMeetingsApi.end(meetingId))}
              >
                {t('actions.endMeeting')}
              </Button>
            ) : null}
            {card.status === 'CREATED' || card.status === 'WAITING' ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void runAction(() => videoMeetingsApi.cancel(meetingId))}
              >
                {t('actions.cancelMeeting')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {canEdit && isHost ? (
        <div className="grid gap-4 md:grid-cols-2">
          <VideoMeetingColleagueInviteSection
            meetingId={meetingId}
            excludeEmployeeId={me?.id}
            initialInvites={colleagues}
          />
          <VideoMeetingInviteSection
            invites={invites}
            freshJoinUrl={freshJoinUrl}
            onCreate={async () => {
              const created = await videoMeetingsApi.createInvite(meetingId, inviteExpiryIso());
              setFreshJoinUrl(
                created.joinUrl.startsWith('http')
                  ? created.joinUrl
                  : buildGuestInviteJoinUrl(created.token),
              );
              setInvites(await videoMeetingsApi.listInvites(meetingId));
            }}
            onRevoke={async (inviteId) => {
              await videoMeetingsApi.revokeInvite(meetingId, inviteId);
              setInvites(await videoMeetingsApi.listInvites(meetingId));
            }}
            t={t}
          />
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t('recording.label')}
        </h2>
        <VideoMeetingRecordingIndicator
          meetingId={meetingId}
          canControl={canEdit && isHost}
          initialRecording={card.recordings?.[0] ?? null}
        />
        <VideoMeetingRecordingPlayback
          meetingId={meetingId}
          recording={card.recordings?.[0] ?? null}
          isHost={isHost}
        />
      </section>

      {canEdit && isHost ? (
        <VideoMeetingEntityLinksSection
          card={card}
          entityType={entityType}
          entityId={entityId}
          onEntityType={setEntityType}
          onEntityId={setEntityId}
          onAttach={async () => {
            if (!entityId.trim()) return;
            setCard(
              await videoMeetingsApi.attachEntityLink(meetingId, entityType, entityId.trim()),
            );
            setEntityId('');
          }}
          onDetach={async (linkId) => {
            setCard(await videoMeetingsApi.detachEntityLink(meetingId, linkId));
          }}
          t={t}
        />
      ) : null}

      {!canEdit && card.entityLinks.length > 0 ? (
        <section className="border-border/80 rounded-xl border p-4">
          <h2 className="mb-2 text-sm font-medium">{t('detail.entityLinks')}</h2>
          <ul className="text-sm">
            {card.entityLinks.map((link) => (
              <li key={link.id}>
                {link.entityType} · {link.entityId}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
