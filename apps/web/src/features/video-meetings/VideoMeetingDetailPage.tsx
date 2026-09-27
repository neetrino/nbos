'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent, ErrorState, LoadingState } from '@/components/shared';
import {
  TASK_SHEET_RAIL_ANCHOR_CLASS,
  TASK_SHEET_WIDTH_CLASS,
} from '@/features/tasks/components/task-sheet-classes';
import { TaskSheetSplitLayout } from '@/features/tasks/components/TaskSheetSplitLayout';
import { usePermission } from '@/lib/permissions';
import {
  videoMeetingsApi,
  type ColleagueInviteListItem,
  type VideoMeetingCard,
} from '@/lib/api/video-meetings';
import { VideoMeetingCornerAction, VideoMeetingLaunchAction } from './VideoMeetingDetailActions';
import { VideoMeetingRoomSidePane } from './VideoMeetingRoomSidePane';
import { resolveVideoMeetingDisplayTitle } from './video-meeting-title';
import { VideoMeetingTitleField } from './VideoMeetingTitleField';
import { videoMeetingStatusLabel } from './video-meeting-status-label';
import { VideoMeetingDetailThread } from './VideoMeetingDetailThread';

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

  const canManage = canEdit && isHost;

  return (
    <VideoMeetingDetailShell meetingId={meetingId} onClose={() => router.push('/video-meetings')}>
      <header className="shrink-0 space-y-2 px-7 pt-5 pb-3">
        <VideoMeetingTitleField
          title={title}
          canEdit={canManage}
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
      </header>
      <TaskSheetSplitLayout
        detail={
          <VideoMeetingRoomSidePane
            meetingId={meetingId}
            card={card}
            canManage={canManage}
            excludeEmployeeId={me?.id}
            colleagues={colleagues}
            onAttach={async (entityType, entityId) => {
              setCard(await videoMeetingsApi.attachEntityLink(meetingId, entityType, entityId));
            }}
            onDetach={async (linkId) => {
              setCard(await videoMeetingsApi.detachEntityLink(meetingId, linkId));
            }}
          />
        }
        chat={
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-border/60 flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3">
              <h2 className="text-sm font-semibold">{t('thread.title')}</h2>
              <div className="flex items-center gap-2">
                <VideoMeetingCornerAction
                  status={card.status}
                  canManage={canManage}
                  busy={busy}
                  onEnd={() => void runAction(() => videoMeetingsApi.end(meetingId))}
                  onCancel={() => void runAction(() => videoMeetingsApi.cancel(meetingId))}
                />
                <VideoMeetingLaunchAction
                  meetingId={meetingId}
                  status={card.status}
                  canManage={canManage}
                  busy={busy}
                  onStart={() =>
                    void runAction(async () => {
                      const started = await videoMeetingsApi.start(meetingId);
                      router.push(`/video-meetings/${meetingId}/room`);
                      return started;
                    })
                  }
                />
              </div>
            </div>
            <VideoMeetingDetailThread
              meetingId={meetingId}
              roomStatus={card.status}
              employeeId={me?.id ?? null}
            />
          </div>
        }
      />
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
        contentClassName={TASK_SHEET_WIDTH_CLASS}
        railAnchorClassName={TASK_SHEET_RAIL_ANCHOR_CLASS}
        showRailActions={false}
        sourcePageHref={`/video-meetings/${meetingId}`}
      >
        {children}
      </EntityDetailSheetContent>
    </Sheet>
  );
}
