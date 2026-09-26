import { ensureVideoMeetingsWebEnabled } from '@/lib/video-meetings/ensure-web-enabled';
import { VideoMeetingDetailPage } from '@/features/video-meetings/VideoMeetingDetailPage';
import { VideoMeetingsListPage } from '@/features/video-meetings/VideoMeetingsListPage';

type PageProps = {
  params: Promise<{ meetingId: string }>;
};

export default async function VideoMeetingDetailRoute({ params }: PageProps) {
  ensureVideoMeetingsWebEnabled();
  const { meetingId } = await params;
  return (
    <>
      <VideoMeetingsListPage />
      <VideoMeetingDetailPage meetingId={meetingId} />
    </>
  );
}
