'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { HEADER_CONTEXT_STATUS_BADGE_CLASS } from '@/components/layout/header-context/header-module-title-constants';
import { StatusBadge } from '@/components/shared';
import type {
  ColleagueInviteListItem,
  VideoMeetingCard,
  VideoMeetingEntityLinkType,
} from '@/lib/api/video-meetings';
import { VideoMeetingColleagueInviteSection } from './VideoMeetingColleagueInviteSection';
import { VideoMeetingEntityLinksSection } from './video-meeting-detail-sections';
import { VideoMeetingGuestLinkButton } from './VideoMeetingGuestLinkButton';

type VideoMeetingRoomSidePaneProps = {
  meetingId: string;
  card: VideoMeetingCard;
  hostLabel: string;
  canManage: boolean;
  excludeEmployeeId?: string;
  colleagues: ColleagueInviteListItem[];
  onAttach: (entityType: VideoMeetingEntityLinkType, entityId: string) => Promise<void>;
  onDetach: (linkId: string) => Promise<void>;
};

/** Left column of the room sheet: people and business links. Chat stays on the right. */
export function VideoMeetingRoomSidePane({
  meetingId,
  card,
  hostLabel,
  canManage,
  excludeEmployeeId,
  colleagues,
  onAttach,
  onDetach,
}: VideoMeetingRoomSidePaneProps) {
  const t = useTranslations('videoMeetings');

  if (!canManage) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4">
        <RoomMetaCapsules card={card} hostLabel={hostLabel} />
        <p className="text-muted-foreground text-sm">{t('detail.participantsHint')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4">
      <RoomMetaCapsules card={card} hostLabel={hostLabel} />
      <VideoMeetingColleagueInviteSection
        meetingId={meetingId}
        excludeEmployeeId={excludeEmployeeId}
        initialInvites={colleagues}
        trailing={<VideoMeetingGuestLinkButton meetingId={meetingId} />}
      />
      <VideoMeetingEntityLinksSection card={card} onAttach={onAttach} onDetach={onDetach} t={t} />
    </div>
  );
}

function RoomMetaCapsules({ card, hostLabel }: { card: VideoMeetingCard; hostLabel: string }) {
  const t = useTranslations('videoMeetings');
  const when = card.scheduledStartsAt ? format(new Date(card.scheduledStartsAt), 'PP') : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge
        label={`${t('detail.host')} · ${hostLabel}`}
        variant="gray"
        className={HEADER_CONTEXT_STATUS_BADGE_CLASS}
      />
      {when ? (
        <StatusBadge
          label={when}
          title={t('detail.schedule')}
          variant="gray"
          className={HEADER_CONTEXT_STATUS_BADGE_CLASS}
        />
      ) : null}
    </div>
  );
}
