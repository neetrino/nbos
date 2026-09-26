import { ensureVideoMeetingsWebEnabled } from '@/lib/video-meetings/ensure-web-enabled';
import { VideoMeetingRoomPage } from '@/features/video-meetings/VideoMeetingRoomPage';

type PageProps = {
  params: Promise<{ meetingId: string }>;
};

export default async function VideoMeetingRoomRoute({ params }: PageProps) {
  ensureVideoMeetingsWebEnabled();
  const { meetingId } = await params;
  return <VideoMeetingRoomPage meetingId={meetingId} />;
}
