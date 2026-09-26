import { ensureVideoMeetingsWebEnabled } from '@/lib/video-meetings/ensure-web-enabled';
import { VideoMeetingDetailPage } from '@/features/video-meetings/VideoMeetingDetailPage';

type PageProps = {
  params: Promise<{ meetingId: string }>;
};

export default async function VideoMeetingDetailRoute({ params }: PageProps) {
  ensureVideoMeetingsWebEnabled();
  const { meetingId } = await params;
  return <VideoMeetingDetailPage meetingId={meetingId} />;
}
