'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { HEADER_CONTEXT_STATUS_BADGE_CLASS } from '@/components/layout/header-context/header-module-title-constants';
import { Sheet } from '@/components/ui/sheet';
import {
  EntityDetailSheetContent,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/shared';
import {
  TASK_SHEET_RAIL_ANCHOR_CLASS,
  TASK_SHEET_WIDTH_CLASS,
} from '@/features/tasks/components/task-sheet-classes';
import { TaskSheetSplitLayout } from '@/features/tasks/components/TaskSheetSplitLayout';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
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
import { videoMeetingStatusLabel, videoMeetingStatusVariant } from './video-meeting-status-label';
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
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('detail.actionError')));
      await refreshMeetingCard(meetingId, setCard, setError);
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
      <header className="flex shrink-0 items-center justify-between gap-4 px-7 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <VideoMeetingTitleField
            title={title}
            canEdit={canManage}
            busy={busy}
            onSave={async (nextTitle) => {
              setCard(await videoMeetingsApi.rename(meetingId, nextTitle));
            }}
          />
          <StatusBadge
            label={videoMeetingStatusLabel(card.status, t)}
            variant={videoMeetingStatusVariant(card.status)}
            className={HEADER_CONTEXT_STATUS_BADGE_CLASS}
          />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <VideoMeetingCornerAction
            status={card.status}
            canManage={canManage}
            busy={busy}
            onCancel={() => void runAction(() => videoMeetingsApi.cancel(meetingId))}
          />
          <VideoMeetingLaunchAction
            meetingId={meetingId}
            status={card.status}
            canManage={canManage}
            busy={busy}
            onEnd={() => void runAction(() => videoMeetingsApi.end(meetingId))}
            onStart={() =>
              void runAction(async () => {
                const started = await videoMeetingsApi.start(meetingId);
                router.push(`/video-meetings/${meetingId}/room`);
                return started;
              })
            }
          />
        </div>
      </header>
      <TaskSheetSplitLayout
        detail={
          <VideoMeetingRoomSidePane
            meetingId={meetingId}
            card={card}
            hostLabel={hostLabel}
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
          <VideoMeetingDetailThread
            meetingId={meetingId}
            roomStatus={card.status}
            employeeId={me?.id ?? null}
          />
        }
      />
    </VideoMeetingDetailShell>
  );
}

async function refreshMeetingCard(
  meetingId: string,
  setCard: (card: VideoMeetingCard) => void,
  setLoadFailed: (failed: boolean) => void,
): Promise<void> {
  try {
    setCard(await videoMeetingsApi.getCard(meetingId));
  } catch {
    setLoadFailed(true);
  }
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
