import { ensureVideoMeetingsWebEnabled } from '@/lib/video-meetings/ensure-web-enabled';
import { VideoMeetingsListPage } from '@/features/video-meetings/VideoMeetingsListPage';

export default function VideoMeetingsPage() {
  ensureVideoMeetingsWebEnabled();
  return <VideoMeetingsListPage />;
}
