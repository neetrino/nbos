'use client';

import { useTranslations } from 'next-intl';
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
  canManage,
  excludeEmployeeId,
  colleagues,
  onAttach,
  onDetach,
}: VideoMeetingRoomSidePaneProps) {
  const t = useTranslations('videoMeetings');

  if (!canManage) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto px-5 py-4">
        <p className="text-muted-foreground text-sm">{t('detail.participantsHint')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4">
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
