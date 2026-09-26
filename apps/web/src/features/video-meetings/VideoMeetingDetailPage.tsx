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
  type InviteListItem,
  type VideoMeetingCard,
  type VideoMeetingEntityLinkType,
} from '@/lib/api/video-meetings';
import { VIDEO_MEETING_INVITE_DEFAULT_TTL_HOURS } from './constants';
import { VideoMeetingRecordingIndicator } from './VideoMeetingRecordingIndicator';
import {
  VideoMeetingEntityLinksSection,
  VideoMeetingInviteSection,
} from './video-meeting-detail-sections';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
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
        setInvites(await videoMeetingsApi.listInvites(meetingId));
      } else {
        setInvites([]);
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

  if (loading) {
    return <LoadingState />;
  }
  if (error || !card) {
    return <ErrorState description={t('loadError')} onRetry={() => void load()} />;
  }

  const hostLabel =
    me?.id === card.hostEmployeeId ? t('detail.youAreHost') : card.hostEmployeeId.slice(0, 8);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{card.title}</h1>
          <p className="text-muted-foreground text-sm">
            {videoMeetingStatusLabel(card.status, t)} · {t('detail.host')}: {hostLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/video-meetings"
            className="border-border hover:bg-muted/90 inline-flex h-7 items-center rounded-lg border px-2.5 text-sm"
          >
            {t('actions.backToList')}
          </Link>
          {card.status === 'ACTIVE' && (
            <Link
              href={`/video-meetings/${meetingId}/room`}
              className="bg-primary text-primary-foreground inline-flex h-7 items-center rounded-lg px-2.5 text-sm"
            >
              {t('actions.joinRoom')}
            </Link>
          )}
        </div>
      </div>

      <VideoMeetingRecordingIndicator
        meetingId={meetingId}
        canControl={canEdit && isHost}
        initialRecording={card.recordings?.[0] ?? null}
      />

      <section className="border-border rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-medium">{t('detail.schedule')}</h2>
        <p className="text-muted-foreground text-sm">
          {card.scheduledStartsAt
            ? format(new Date(card.scheduledStartsAt), 'PPp')
            : t('detail.notScheduled')}
        </p>
      </section>

      {canEdit && isHost && (
        <section className="flex flex-wrap gap-2">
          {card.status !== 'ACTIVE' && card.status !== 'ENDED' && card.status !== 'CANCELLED' && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => void runAction(() => videoMeetingsApi.start(meetingId))}
            >
              {t('actions.startMeeting')}
            </Button>
          )}
          {card.status === 'ACTIVE' && (
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void runAction(() => videoMeetingsApi.end(meetingId))}
            >
              {t('actions.endMeeting')}
            </Button>
          )}
          {(card.status === 'CREATED' || card.status === 'WAITING') && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void runAction(() => videoMeetingsApi.cancel(meetingId))}
            >
              {t('actions.cancelMeeting')}
            </Button>
          )}
        </section>
      )}

      <section className="border-border rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-medium">{t('detail.sessions')}</h2>
        {card.sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('detail.noSessions')}</p>
        ) : (
          <ul className="text-muted-foreground space-y-1 text-sm">
            {card.sessions.map((session) => (
              <li key={session.id}>
                {session.livekitRoomName} ·{' '}
                {session.startedAt ? format(new Date(session.startedAt), 'PPp') : '—'}
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground mt-2 text-xs">{t('detail.participantsHint')}</p>
      </section>

      {canEdit && isHost && (
        <VideoMeetingInviteSection
          invites={invites}
          freshSecret={freshSecret}
          onCreate={async () => {
            const created = await videoMeetingsApi.createInvite(meetingId, inviteExpiryIso());
            setFreshSecret(created.token);
            setInvites(await videoMeetingsApi.listInvites(meetingId));
          }}
          onRevoke={async (inviteId) => {
            await videoMeetingsApi.revokeInvite(meetingId, inviteId);
            setInvites(await videoMeetingsApi.listInvites(meetingId));
          }}
          t={t}
        />
      )}

      {canEdit && isHost && (
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
      )}

      {!canEdit && card.entityLinks.length > 0 && (
        <section className="border-border rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium">{t('detail.entityLinks')}</h2>
          <ul className="text-sm">
            {card.entityLinks.map((link) => (
              <li key={link.id}>
                {link.entityType} · {link.entityId}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
